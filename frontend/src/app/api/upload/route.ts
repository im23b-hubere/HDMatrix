import { type NextRequest, NextResponse } from "next/server"
import { processPdf } from "@/lib/pdf-processor"
import { saveDocument } from "@/lib/db"
import { v4 as uuidv4 } from "uuid"

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "Keine Datei gefunden" }, { status: 400 })
    }

    // Nur PDF-Dateien akzeptieren
    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "Nur PDF-Dateien werden unterstützt" }, { status: 400 })
    }

    // Datei in Buffer umwandeln
    const fileBuffer = Buffer.from(await file.arrayBuffer())

    // Dokument-ID generieren
    const documentId = uuidv4()

    // Dokument in der Datenbank speichern
    const document = await saveDocument({
      title: file.name,
      file_path: `/uploads/${file.name}`,
      upload_date: new Date(),
      uploaded_by: "user", // Hier könnte die Benutzer-ID stehen
      file_type: "pdf",
    })

    // PDF verarbeiten und in Vektorspeicher speichern
    const result = await processPdf(fileBuffer, file.name, {
      documentId,
      title: file.name,
      uploadDate: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      documentId: result.documentId,
      chunkCount: result.chunkCount,
      message: `PDF erfolgreich verarbeitet und in ${result.chunkCount} Chunks aufgeteilt.`,
    })
  } catch (error) {
    console.error("Fehler beim Hochladen der Datei:", error)
    return NextResponse.json({ error: "Fehler beim Verarbeiten der Datei" }, { status: 500 })
  }
}

