import { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Icons } from "@/components/icons"
import { Dashboard } from "@/components/dashboard"

export const metadata: Metadata = {
  title: "Dashboard - TalentBridge",
  description: "Übersicht über Mitarbeiter, Fähigkeiten und Dokumente",
}

export default function Home() {
  return (
    <main className="container mx-auto p-8">
      <Dashboard />
    </main>
  )
} 