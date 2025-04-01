import { type NextRequest, NextResponse } from "next/server"
import { streamChatResponse } from "@/lib/ai-service"
import { extractTextFromPdf } from "@/lib/pdf-processor"
import { saveDocument } from "@/lib/db"

interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

// Chat-API-Route mit Streaming-Unterstützung
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const messagesJson = formData.get("messages") as string
    const messages = JSON.parse(messagesJson)

    // Prüfen, ob eine Datei angehängt wurde
    const file = formData.get("file") as File | null

    // Wenn eine PDF-Datei angehängt wurde, verarbeite sie
    if (file && file.type === "application/pdf") {
      const fileBuffer = Buffer.from(await file.arrayBuffer())
      const fileName = file.name

      // Text aus PDF extrahieren
      const pdfText = await extractTextFromPdf(fileBuffer)

      // Dokument in der Datenbank speichern
      const document = await saveDocument({
        title: fileName,
        file_path: `/uploads/${fileName}`,
        upload_date: new Date(),
        uploaded_by: "user", // Hier könnte die Benutzer-ID stehen
        file_type: "pdf",
      })

      // Letzte Benutzeranfrage extrahieren
      const lastUserMessage = messages.findLast((msg: any) => msg.role === "user")?.content || ""

      // Streaming-Antwort mit PDF-Kontext
      const encoder = new TextEncoder()
      const stream = new TransformStream()
      const writer = stream.writable.getWriter()

      // Antwort streamen
      streamChatResponse(
        [
          ...messages,
          {
            role: "system",
            content: `
              Der Benutzer hat eine PDF-Datei mit dem Namen "${fileName}" hochgeladen.
              Hier ist der Inhalt der PDF:
              ${pdfText.substring(0, 8000)}... (gekürzt)
              
              Beantworte die Anfrage des Benutzers basierend auf dem Inhalt dieser PDF.
            `,
          },
        ],
        (chunk) => {
          writer.write(encoder.encode(chunk))
        },
      ).finally(() => {
        writer.close()
      })

      return new Response(stream.readable, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
        },
      })
    }

    // Normale Chat-Anfrage ohne Datei
    const encoder = new TextEncoder()
    const stream = new TransformStream()
    const writer = stream.writable.getWriter()

    // Antwort streamen
    streamChatResponse(messages as Message[], (chunk: string) => {
      writer.write(encoder.encode(chunk))
    }).finally(() => {
      writer.close()
    })

    return new Response(stream.readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    })
  } catch (error) {
    console.error("Fehler beim Chat:", error)
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 })
  }
}

