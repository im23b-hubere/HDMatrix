"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence, useAnimation } from "framer-motion"
import { Search, Filter, X, ChevronDown, ChevronUp, Mail, Phone, MapPin, Briefcase, Award } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DatabaseService } from '../services/db-service'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../components/ui/select"

interface Employee {
    id: number
    vorname: string
    nachname: string
    email: string
    position: string
    abteilung_id: number
    skills: string[]
}

// Kategorisierte Skills für eine bessere Übersicht
const SKILL_CATEGORIES: Record<string, string[]> = {
    'IT & Entwicklung': ['Python', 'JavaScript', 'Java', 'C#', 'PHP', 'React', 'Angular', 'Node.js', 'SQL', 'Docker'],
    'Data Science & KI': ['Machine Learning', 'TensorFlow', 'Data Science', 'PyTorch', 'Pandas'],
    'Design': ['UI/UX Design', 'Figma', 'Adobe XD', 'Grafikdesign', 'Motion Design'],
    'Marketing': ['SEO', 'Content Marketing', 'Social Media', 'Digital Marketing', 'PR'],
    'Management': ['Projektmanagement', 'Scrum', 'JIRA', 'Prince2', 'Agile'],
    'Personal & HR': ['Recruiting', 'Personalentwicklung', 'Coaching', 'Arbeitsrecht'],
    'Finanzen': ['SAP', 'Controlling', 'DATEV', 'Buchhaltung'],
    'Sonstige': ['Qualitätsmanagement', 'Compliance', 'Prozessoptimierung', 'Supply Chain']
};

// Abteilungen mit IDs und Beschreibungen
const DEPARTMENTS = [
    { id: 1, name: 'IT & Entwicklung', description: 'Softwareentwicklung und IT-Infrastruktur' },
    { id: 2, name: 'Data Science & KI', description: 'Datenanalyse und Künstliche Intelligenz' },
    { id: 3, name: 'Design & Kreativ', description: 'UI/UX Design und Grafikdesign' },
    { id: 4, name: 'Marketing & Kommunikation', description: 'Digitales Marketing und PR' },
    { id: 5, name: 'Projektmanagement', description: 'Projektleitung und Methoden' },
    { id: 6, name: 'Personal & HR', description: 'Personalwesen und Personalentwicklung' },
    { id: 7, name: 'Finanzen & Controlling', description: 'Finanzwesen und Controlling' },
    { id: 8, name: 'Qualität & Compliance', description: 'Qualitätsmanagement und Compliance' }
];

export function EmployeeSearch() {
    const [searchQuery, setSearchQuery] = useState('')
    const [employees, setEmployees] = useState<Employee[]>([])
    const [departments, setDepartments] = useState<Array<{id: number, name: string, description: string}>>([])
    const [selectedDepartment, setSelectedDepartment] = useState<string>('all')
    const [selectedSkills, setSelectedSkills] = useState<string[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const controls = useAnimation()

    // Funktion zum Ausführen der Suche
    const performSearch = async () => {
        setIsLoading(true)
        try {
            const result = await DatabaseService.searchEmployees(searchQuery, {
                department: selectedDepartment === 'all' ? undefined : parseInt(selectedDepartment),
                skills: selectedSkills
            })
            setEmployees(result.employees)
        } catch (error) {
            console.error('Error searching employees:', error)
        } finally {
            setIsLoading(false)
        }
    }

    // Suche automatisch ausführen, wenn sich die ausgewählten Fähigkeiten ändern
    useEffect(() => {
        performSearch()
    }, [selectedSkills])

    useEffect(() => {
        // Animation beim Laden
        controls.start({ y: 0, opacity: 1 })
        
        // Setze die vordefinierten Abteilungen
        setDepartments(DEPARTMENTS)
    }, [controls])

    const handleDepartmentChange = (value: string) => {
        setSelectedDepartment(value)
        performSearch() // Suche auch bei Abteilungsänderung ausführen
    }

    const handleSearch = () => {
        performSearch()
    }

    const handleSkillClick = (skill: string) => {
        setSelectedSkills(prev => 
            prev.includes(skill) 
                ? prev.filter(s => s !== skill)
                : [...prev, skill]
        )
    }

    // Funktion zum Abrufen der Fähigkeiten basierend auf der ausgewählten Abteilung
    const getDepartmentSkills = () => {
        if (selectedDepartment === 'all') {
            // Bei "Alle Abteilungen" zeigen wir alle Fähigkeiten an
            return Object.values(SKILL_CATEGORIES).flat()
        }
        
        const department = DEPARTMENTS.find(dept => dept.id.toString() === selectedDepartment)
        if (department) {
            // Finde die passende Kategorie basierend auf dem Abteilungsnamen
            const matchingCategory = Object.keys(SKILL_CATEGORIES).find(category => 
                department.name.includes(category) || category.includes(department.name)
            )
            if (matchingCategory) {
                return SKILL_CATEGORIES[matchingCategory]
            }
        }
        return []
    }

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Mitarbeiter-Suche</h2>
                <p className="text-muted-foreground">Finden Sie Mitarbeiter anhand von Namen, Abteilungen oder Fähigkeiten</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* Suchfeld */}
                <div className="space-y-2">
                    <label className="text-sm font-medium">Name oder Stichwort</label>
                    <Input
                        placeholder="Suchen..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full"
                    />
                </div>

                {/* Abteilungsauswahl */}
                <div className="space-y-2">
                    <label className="text-sm font-medium">Abteilung</label>
                    <Select value={selectedDepartment} onValueChange={handleDepartmentChange}>
                        <SelectTrigger>
                            <SelectValue placeholder="Abteilung auswählen" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Alle Abteilungen</SelectItem>
                            {departments.map((dept) => (
                                <SelectItem key={dept.id} value={dept.id.toString()}>
                                    <div className="flex flex-col">
                                        <span>{dept.name}</span>
                                        <span className="text-xs text-muted-foreground">{dept.description}</span>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Suchbutton */}
                <div className="space-y-2">
                    <label className="text-sm font-medium">&nbsp;</label>
                    <Button 
                        onClick={handleSearch} 
                        className="w-full"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Suche...' : 'Suchen'}
                    </Button>
                </div>
            </div>

            {/* Fähigkeiten-Filter */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Fähigkeiten filtern</h3>
                    {selectedSkills.length > 0 && (
                        <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setSelectedSkills([])}
                            className="text-muted-foreground hover:text-foreground"
                        >
                            Alle Filter zurücksetzen
                        </Button>
                    )}
                </div>

                {/* Ausgewählte Fähigkeiten */}
                {selectedSkills.length > 0 && (
                    <div className="space-y-2">
                        <div className="text-sm font-medium text-muted-foreground">
                            Ausgewählte Fähigkeiten:
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {selectedSkills.map((skill) => (
                                <Badge
                                    key={skill}
                                    variant="default"
                                    className="cursor-pointer"
                                    onClick={() => handleSkillClick(skill)}
                                >
                                    {skill}
                                    <X className="ml-1 h-3 w-3" />
                                </Badge>
                            ))}
                        </div>
                    </div>
                )}

                {/* Verfügbare Fähigkeiten */}
                <div className="space-y-2">
                    <div className="text-sm font-medium text-muted-foreground">
                        {selectedDepartment === 'all' 
                            ? 'Verfügbare Fähigkeiten:'
                            : `Verfügbare Fähigkeiten in ${DEPARTMENTS.find(d => d.id.toString() === selectedDepartment)?.name}:`
                        }
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {getDepartmentSkills().map((skill) => (
                            <Badge
                                key={skill}
                                variant={selectedSkills.includes(skill) ? "default" : "outline"}
                                className="cursor-pointer"
                                onClick={() => handleSkillClick(skill)}
                            >
                                {skill}
                            </Badge>
                        ))}
                    </div>
                </div>
            </div>

            {/* Ergebnisliste */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold">
                    Gefundene Mitarbeiter ({employees.length})
                </h3>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {employees.map((employee) => (
                        <Card key={employee.id} className="p-4">
                            <div className="space-y-2">
                                <div className="font-medium">
                                    {employee.vorname} {employee.nachname}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    {employee.email}
                                </div>
                                <div className="flex flex-wrap gap-1">
                                    {employee.skills.map((skill) => (
                                        <Badge key={skill} variant="secondary" className="text-xs">
                                            {skill}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    )
}

// Add missing Avatar component
function Avatar({
    className,
    children,
    ...props
}: React.HTMLAttributes<HTMLDivElement> & { children: React.ReactNode }) {
    return (
        <div className={`relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full ${className}`} {...props}>
            {children}
        </div>
    )
}

function AvatarImage({ src, alt, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) {
    return (
        <img src={src || "/placeholder.svg"} alt={alt} className="aspect-square h-full w-full object-cover" {...props} />
    )
}

function AvatarFallback({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div className="flex h-full w-full items-center justify-center rounded-full bg-muted" {...props}>
            {children}
        </div>
    )
}

