export {}; // Make this file a module

import { Pool } from "pg"

// Datenbankverbindung konfigurieren
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: Number.parseInt(process.env.DB_PORT || "5432"),
})

// Typen für die Datenbank-Entitäten
export interface Employee {
  id: string
  name: string
  position: string
  department: string
  skills: string[]
  email: string
  phone: string
  location: string
  experience: number
  avatar_url: string
}

export interface Department {
  id: string
  name: string
  description: string
  employee_count: number
}

export interface Document {
  id: string
  title: string
  file_path: string
  upload_date: Date
  uploaded_by: string
  content_vector?: number[]
  file_type: string
}

// Mitarbeiter nach Suchbegriff finden
export async function searchEmployees(query: string): Promise<Employee[]> {
  try {
    // Suche in Namen, Fähigkeiten, Abteilungen und Positionen
    const result = await pool.query(
      `
      SELECT e.*, array_agg(s.name) as skills
      FROM employees e
      LEFT JOIN employee_skills es ON e.id = es.employee_id
      LEFT JOIN skills s ON es.skill_id = s.id
      WHERE 
        e.name ILIKE $1 OR
        e.position ILIKE $1 OR
        e.department ILIKE $1 OR
        s.name ILIKE $1
      GROUP BY e.id
      ORDER BY e.name ASC
      LIMIT 20
    `,
      [`%${query}%`],
    )

    return result.rows
  } catch (error) {
    console.error("Fehler beim Suchen von Mitarbeitern:", error)
    throw error
  }
}

// Mitarbeiter nach Abteilung finden
export async function getEmployeesByDepartment(department: string): Promise<Employee[]> {
  try {
    const result = await pool.query(
      `
      SELECT e.*, array_agg(s.name) as skills
      FROM employees e
      LEFT JOIN employee_skills es ON e.id = es.employee_id
      LEFT JOIN skills s ON es.skill_id = s.id
      WHERE e.department = $1
      GROUP BY e.id
      ORDER BY e.name ASC
    `,
      [department],
    )

    return result.rows
  } catch (error) {
    console.error("Fehler beim Abrufen von Mitarbeitern nach Abteilung:", error)
    throw error
  }
}

// Mitarbeiter nach Fähigkeiten finden
export async function getEmployeesBySkills(skills: string[]): Promise<Employee[]> {
  try {
    const placeholders = skills.map((_, i) => `$${i + 1}`).join(", ")

    const result = await pool.query(
      `
      SELECT e.*, array_agg(s.name) as skills
      FROM employees e
      JOIN employee_skills es ON e.id = es.employee_id
      JOIN skills s ON es.skill_id = s.id
      WHERE s.name IN (${placeholders})
      GROUP BY e.id
      ORDER BY e.name ASC
    `,
      skills,
    )

    return result.rows
  } catch (error) {
    console.error("Fehler beim Abrufen von Mitarbeitern nach Fähigkeiten:", error)
    throw error
  }
}

// Alle Abteilungen mit Statistiken abrufen
export async function getDepartmentsWithStats(): Promise<Department[]> {
  try {
    const result = await pool.query(`
      SELECT 
        d.id, 
        d.name, 
        d.description,
        COUNT(e.id) as employee_count
      FROM departments d
      LEFT JOIN employees e ON d.name = e.department
      GROUP BY d.id, d.name
      ORDER BY d.name ASC
    `)

    return result.rows
  } catch (error) {
    console.error("Fehler beim Abrufen von Abteilungen:", error)
    throw error
  }
}

// Dokumente nach Suchbegriff finden
export async function searchDocuments(query: string): Promise<Document[]> {
  try {
    const result = await pool.query(
      `
      SELECT * FROM documents
      WHERE title ILIKE $1
      ORDER BY upload_date DESC
      LIMIT 10
    `,
      [`%${query}%`],
    )

    return result.rows
  } catch (error) {
    console.error("Fehler beim Suchen von Dokumenten:", error)
    throw error
  }
}

// Dokument speichern
export async function saveDocument(document: Omit<Document, "id">): Promise<Document> {
  try {
    const result = await pool.query(
      `
      INSERT INTO documents (title, file_path, upload_date, uploaded_by, file_type)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `,
      [document.title, document.file_path, document.upload_date, document.uploaded_by, document.file_type],
    )

    return result.rows[0]
  } catch (error) {
    console.error("Fehler beim Speichern des Dokuments:", error)
    throw error
  }
}

// Verbindung schließen (bei Serverbeendigung)
export async function closePool(): Promise<void> {
  await pool.end()
}
