import { type NextRequest, NextResponse } from "next/server"
import { searchEmployees } from "@/lib/db"

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const query = searchParams.get("query")

    if (!query) {
      return NextResponse.json({ error: "Suchbegriff erforderlich" }, { status: 400 })
    }

    const employees = await searchEmployees(query)

    return NextResponse.json(employees)
  } catch (error) {
    console.error("Fehler in der Such-API:", error)
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 })
  }
}

