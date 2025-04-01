export {}; // Make this file a module

import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf"
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter"
import { OpenAIEmbeddings } from "@langchain/openai"
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase"
import { createClient } from "@supabase/supabase-js"
import { Document } from "@langchain/core/documents"
import fs from "fs"
import path from "path"
import os from "os"

interface DocumentChunk {
  pageContent: string;
  metadata?: Record<string, any>;
}

// Supabase-Client für Vektorspeicher
const supabaseClient = createClient(process.env.SUPABASE_URL || "", process.env.SUPABASE_API_KEY || "")

// OpenAI-Embeddings für Vektorisierung
const embeddings = new OpenAIEmbeddings({
  openAIApiKey: process.env.OPENAI_API_KEY,
})

// Temporäres Verzeichnis für hochgeladene PDFs
const TEMP_DIR = path.join(os.tmpdir(), "talentbridge-uploads")

// Sicherstellen, dass das temporäre Verzeichnis existiert
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true })
}

// PDF-Datei verarbeiten und in Vektorspeicher speichern
export async function processPdf(
  fileBuffer: Buffer,
  fileName: string,
  metadata: Record<string, any>,
): Promise<{ documentId: string; chunkCount: number }> {
  try {
    // Temporäre Datei speichern
    const tempFilePath = path.join(TEMP_DIR, fileName)
    fs.writeFileSync(tempFilePath, fileBuffer)

    // PDF laden und in Text umwandeln
    const loader = new PDFLoader(tempFilePath)
    const docs = await loader.load()

    // Text in Chunks aufteilen für bessere Verarbeitung
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    })
    const chunks = await textSplitter.splitDocuments(docs)

    // Metadaten zu jedem Chunk hinzufügen
    const enhancedChunks = chunks.map((chunk: DocumentChunk) => {
      return new Document({
        pageContent: chunk.pageContent,
        metadata: {
          ...chunk.metadata,
          ...metadata,
          fileName,
        },
      })
    })

    // In Vektorspeicher speichern
    const vectorStore = await SupabaseVectorStore.fromDocuments(enhancedChunks, embeddings, {
      client: supabaseClient,
      tableName: "documents",
      queryName: "match_documents",
    })

    // Temporäre Datei löschen
    fs.unlinkSync(tempFilePath)

    return {
      documentId: metadata.documentId,
      chunkCount: enhancedChunks.length,
    }
  } catch (error) {
    console.error("Fehler bei der PDF-Verarbeitung:", error)
    throw error
  }
}

// Ähnliche Dokumente basierend auf einer Abfrage finden
export async function queryDocuments(query: string, filter?: Record<string, any>, limit = 5): Promise<Document[]> {
  try {
    const vectorStore = await SupabaseVectorStore.fromExistingIndex(embeddings, {
      client: supabaseClient,
      tableName: "documents",
      queryName: "match_documents",
    })

    const results = await vectorStore.similaritySearch(query, limit, filter)
    return results
  } catch (error) {
    console.error("Fehler bei der Dokumentenabfrage:", error)
    throw error
  }
}

// Text aus einem PDF extrahieren (ohne Vektorisierung)
export async function extractTextFromPdf(fileBuffer: Buffer): Promise<string> {
  try {
    // Temporäre Datei speichern
    const tempFilePath = path.join(TEMP_DIR, `temp-${Date.now()}.pdf`)
    fs.writeFileSync(tempFilePath, fileBuffer)

    // PDF laden und in Text umwandeln
    const loader = new PDFLoader(tempFilePath)
    const docs = await loader.load()

    // Temporäre Datei löschen
    fs.unlinkSync(tempFilePath)

    // Alle Texte zusammenführen
    return docs.map((doc: Document) => doc.pageContent).join("\n\n")
  } catch (error) {
    console.error("Fehler beim Extrahieren von Text aus PDF:", error)
    throw error
  }
}
