export {}; // Make this file a module

import OpenAI from "openai"
import { searchEmployees, getEmployeesBySkills } from "./db"
import { queryDocuments } from "./pdf-processor"

// Systemanweisung für den KI-Assistenten
const SYSTEM_PROMPT = `
Du bist ein KI-Assistent für TalentBridge, ein internes Mitarbeiter-Informationssystem.
Du hilfst Benutzern, Informationen über Mitarbeiter, ihre Fähigkeiten und Dokumente zu finden.

Verfügbare Daten:
- Mitarbeiterprofile mit Namen, Positionen, Abteilungen, Fähigkeiten und Kontaktdaten
- Dokumente und PDFs mit Projektinformationen und Qualifikationsnachweisen

Wenn du nach Mitarbeitern gefragt wirst, gib strukturierte Informationen zurück.
Wenn du nach Dokumenten gefragt wirst, fasse die relevanten Informationen zusammen.
Antworte immer auf Deutsch und in einem professionellen, hilfsbereiten Ton.
`

// Typen für die KI-Anfragen
interface EmployeeQueryParams {
  skills?: string[];
  query?: string;
  documentId?: string;
}

interface DocumentQueryParams {
  query: string
  documentId?: string
}

interface Employee {
  id: string;
  name: string;
  department: string;
  skills: string[];
}

interface TextChunk {
  type: string;
  text: string;
}

interface StreamResponse {
  type: string;
  text?: string;
  textDelta?: string;
}

interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Mitarbeiterinformationen abfragen
export async function queryEmployeeInfo(userQuery: string, params: EmployeeQueryParams = {}): Promise<string> {
  try {
    let employees: Employee[] = []
    if (params.skills && params.skills.length > 0) {
      employees = await getEmployeesBySkills(params.skills)
    } else if (params.query) {
      employees = await searchEmployees(params.query)
    }

    const context = employees.length > 0
      ? `Hier sind die gefundenen Mitarbeiter: ${JSON.stringify(employees, null, 2)}`
      : "Es wurden keine passenden Mitarbeiter gefunden."

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: "Du bist ein hilfreicher Assistent." },
        { role: "user", content: `${context}\n\nBitte beantworte folgende Frage: ${userQuery}` }
      ],
    });

    return completion.choices[0]?.message?.content || "Keine Antwort verfügbar."
  } catch (error) {
    console.error("Fehler bei der KI-Anfrage:", error)
    throw error
  }
}

// Dokumenteninformationen abfragen
export async function queryDocumentInfo(userQuery: string, documentId?: string): Promise<string> {
  try {
    const context = documentId
      ? await queryDocuments(documentId)
      : "Kein Dokument ausgewählt."

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: "Du bist ein hilfreicher Assistent." },
        { role: "user", content: `Verfügbare Dokumentinformationen: ${context}\n\nBitte beantworte die folgende Frage: ${userQuery}` }
      ],
    });

    return completion.choices[0]?.message?.content || "Keine Antwort verfügbar."
  } catch (error) {
    console.error("Fehler bei der KI-Abfrage zu Dokumenten:", error)
    throw error
  }
}

// Chat-Stream generieren
export async function streamChatResponse(messages: Message[], onChunk: (chunk: string) => void): Promise<string> {
  let fullText = ""

  try {
    const stream = await openai.chat.completions.create({
      model: "gpt-4",
      messages,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || "";
      if (content) {
        onChunk(content);
        fullText += content;
      }
    }

    return fullText
  } catch (error) {
    console.error("Fehler beim Generieren des Chat-Streams:", error)
    throw error
  }
}
