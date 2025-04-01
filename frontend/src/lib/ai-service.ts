export {}; // Make this file a module

import { generateText, streamText } from "ai"
import { openai } from "@ai-sdk/openai"
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
  query?: string
  skills?: string[]
  department?: string
}

interface DocumentQueryParams {
  query: string
  documentId?: string
}

// Mitarbeiterinformationen abfragen
export async function queryEmployeeInfo(userQuery: string, params: EmployeeQueryParams = {}): Promise<string> {
  try {
    // Mitarbeiterdaten abrufen
    let employees = []
    if (params.skills && params.skills.length > 0) {
      employees = await getEmployeesBySkills(params.skills)
    } else if (params.query) {
      employees = await searchEmployees(params.query)
    }

    // Kontext für die KI erstellen
    const context =
      employees.length > 0
        ? `Hier sind die gefundenen Mitarbeiter: ${JSON.stringify(employees, null, 2)}`
        : "Es wurden keine passenden Mitarbeiter gefunden."

    // KI-Antwort generieren
    const { text } = await generateText({
      model: openai("gpt-4o"),
      system: SYSTEM_PROMPT,
      prompt: `
        Benutzeranfrage: ${userQuery}
        
        Verfügbare Daten:
        ${context}
        
        Bitte antworte auf die Anfrage basierend auf den verfügbaren Daten. 
        Wenn keine passenden Daten gefunden wurden, schlage alternative Suchbegriffe vor.
      `,
    })

    return text
  } catch (error) {
    console.error("Fehler bei der KI-Abfrage zu Mitarbeitern:", error)
    return "Es ist ein Fehler bei der Verarbeitung Ihrer Anfrage aufgetreten. Bitte versuchen Sie es später erneut."
  }
}

// PDF-Dokumente abfragen
export async function queryDocumentInfo(userQuery: string, params: DocumentQueryParams): Promise<string> {
  try {
    // Relevante Dokumente finden
    const documentChunks = await queryDocuments(
      params.query,
      params.documentId ? { documentId: params.documentId } : undefined,
    )

    // Kontext für die KI erstellen
    const context =
      documentChunks.length > 0
        ? documentChunks
            .map(
              (doc) => `
        Inhalt: ${doc.pageContent}
        Quelle: ${doc.metadata.fileName}, Seite ${doc.metadata.pageNumber}
      `,
            )
            .join("\n\n")
        : "Es wurden keine relevanten Dokumente gefunden."

    // KI-Antwort generieren
    const { text } = await generateText({
      model: openai("gpt-4o"),
      system: SYSTEM_PROMPT,
      prompt: `
        Benutzeranfrage: ${userQuery}
        
        Verfügbare Dokumentinformationen:
        ${context}
        
        Bitte beantworte die Anfrage basierend auf den verfügbaren Dokumenten.
        Wenn keine relevanten Informationen gefunden wurden, teile dies dem Benutzer mit.
      `,
    })

    return text
  } catch (error) {
    console.error("Fehler bei der KI-Abfrage zu Dokumenten:", error)
    return "Es ist ein Fehler bei der Verarbeitung Ihrer Anfrage aufgetreten. Bitte versuchen Sie es später erneut."
  }
}

// Allgemeine Chat-Anfrage mit Streaming-Antwort
export async function streamChatResponse(
  messages: { role: "user" | "assistant" | "system"; content: string }[],
  onChunk: (chunk: string) => void,
): Promise<string> {
  try {
    // System-Prompt hinzufügen, falls nicht vorhanden
    if (!messages.some((msg) => msg.role === "system")) {
      messages.unshift({ role: "system", content: SYSTEM_PROMPT })
    }

    let fullText = ""

    // Streaming-Antwort generieren
    const result = streamText({
      model: openai("gpt-4o"),
      messages,
      onChunk: ({ chunk }) => {
        if (chunk.type === "text-delta") {
          onChunk(chunk.text)
          fullText += chunk.text
        }
      },
    })

    await result.text
    return fullText
  } catch (error) {
    console.error("Fehler beim Streaming der Chat-Antwort:", error)
    const errorMessage =
      "Es ist ein Fehler bei der Verarbeitung Ihrer Anfrage aufgetreten. Bitte versuchen Sie es später erneut."
    onChunk(errorMessage)
    return errorMessage
  }
}
