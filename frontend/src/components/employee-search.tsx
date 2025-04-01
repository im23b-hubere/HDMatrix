"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence, useAnimation } from "framer-motion"
import { Search, Filter, X, ChevronDown, ChevronUp, Mail, Phone, MapPin, Briefcase, Award } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Employee {
  id: string
  name: string
  position: string
  department: string
  skills: string[]
  email: string
  phone: string
  location: string
  experience: number
  avatar: string
}

export function EmployeeSearch() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<Employee[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([])
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [sortBy, setSortBy] = useState<"name" | "department" | "experience">("name")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const searchInputRef = useRef<HTMLInputElement>(null)
  const controls = useAnimation()

  // Mock departments for filter
  const departments = ["Entwicklung", "Marketing", "Vertrieb", "Personal", "Finanzen", "Support"]

  // Focus search input on mount
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus()
    }

    // Trigger initial animation
    controls.start({
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 300, damping: 30 },
    })
  }, [controls])

  const searchEmployees = async () => {
    if (!query) return

    setIsLoading(true)

    try {
      // API-Aufruf zum Backend
      const response = await fetch(`/api/search?query=${encodeURIComponent(query)}`)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      // Filtern nach Abteilung, falls ausgewählt
      let filteredResults = data
      if (selectedDepartments.length > 0) {
        filteredResults = data.filter((emp) => selectedDepartments.includes(emp.department))
      }

      // Sortieren der Ergebnisse
      filteredResults.sort((a, b) => {
        let comparison = 0

        switch (sortBy) {
          case "name":
            comparison = a.name.localeCompare(b.name)
            break
          case "department":
            comparison = a.department.localeCompare(b.department)
            break
          case "experience":
            comparison = a.experience - b.experience
            break
        }

        return sortDirection === "asc" ? comparison : -comparison
      })

      setResults(filteredResults)
    } catch (error) {
      console.error("Fehler bei der Mitarbeitersuche:", error)
      // Optional: Fehlermeldung anzeigen
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      searchEmployees()
    }
  }

  const toggleSort = (field: "name" | "department" | "experience") => {
    if (sortBy === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortBy(field)
      setSortDirection("asc")
    }
  }

  const toggleDepartmentFilter = (department: string) => {
    setSelectedDepartments((prev) =>
      prev.includes(department) ? prev.filter((d) => d !== department) : [...prev, department],
    )
  }

  const clearFilters = () => {
    setSelectedDepartments([])
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 300, damping: 24 },
    },
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ y: -20, opacity: 0 }} animate={controls} className="space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Mitarbeiter-Suche</h2>
        <p className="text-muted-foreground">Finden Sie Mitarbeiter mit bestimmten Fähigkeiten oder Qualifikationen</p>
      </motion.div>

      <motion.div
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col gap-4"
      >
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Fähigkeiten, Name oder Abteilung eingeben..."
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={searchEmployees} disabled={isLoading} className="min-w-[100px]">
              {isLoading ? (
                <div className="flex items-center">
                  <div className="h-4 w-4 rounded-full border-2 border-current border-r-transparent animate-spin mr-2" />
                  <span>Suche...</span>
                </div>
              ) : (
                "Suchen"
              )}
            </Button>
            <Button variant="outline" size="icon" onClick={() => setFiltersOpen(!filtersOpen)} className="relative">
              <Filter className="h-4 w-4" />
              {selectedDepartments.length > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] text-primary-foreground flex items-center justify-center">
                  {selectedDepartments.length}
                </span>
              )}
            </Button>
          </div>
        </div>

        <AnimatePresence>
          {filtersOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="border rounded-lg p-4 bg-card">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-medium">Filter</h3>
                  {selectedDepartments.length > 0 && (
                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                      <X className="h-3 w-3 mr-1" />
                      Filter zurücksetzen
                    </Button>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Abteilungen</h4>
                    <div className="flex flex-wrap gap-2">
                      {departments.map((dept) => (
                        <Badge
                          key={dept}
                          variant={selectedDepartments.includes(dept) ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => toggleDepartmentFilter(dept)}
                        >
                          {dept}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium mb-2">Sortieren nach</h4>
                    <div className="flex gap-2">
                      <Button
                        variant={sortBy === "name" ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleSort("name")}
                        className="flex items-center gap-1"
                      >
                        Name
                        {sortBy === "name" &&
                          (sortDirection === "asc" ? (
                            <ChevronUp className="h-3 w-3" />
                          ) : (
                            <ChevronDown className="h-3 w-3" />
                          ))}
                      </Button>
                      <Button
                        variant={sortBy === "department" ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleSort("department")}
                        className="flex items-center gap-1"
                      >
                        Abteilung
                        {sortBy === "department" &&
                          (sortDirection === "asc" ? (
                            <ChevronUp className="h-3 w-3" />
                          ) : (
                            <ChevronDown className="h-3 w-3" />
                          ))}
                      </Button>
                      <Button
                        variant={sortBy === "experience" ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleSort("experience")}
                        className="flex items-center gap-1"
                      >
                        Erfahrung
                        {sortBy === "experience" &&
                          (sortDirection === "asc" ? (
                            <ChevronUp className="h-3 w-3" />
                          ) : (
                            <ChevronDown className="h-3 w-3" />
                          ))}
                      </Button>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium mb-2">Ansicht</h4>
                    <Tabs
                      value={viewMode}
                      onValueChange={(v) => setViewMode(v as "grid" | "list")}
                      className="w-[200px]"
                    >
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="grid">Kacheln</TabsTrigger>
                        <TabsTrigger value="list">Liste</TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-3"}
          >
            {[...Array(6)].map((_, i) =>
              viewMode === "grid" ? (
                <Card key={i} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="p-6 space-y-4">
                      <div className="flex items-center gap-4">
                        <Skeleton className="h-16 w-16 rounded-full" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-[150px]" />
                          <Skeleton className="h-4 w-[100px]" />
                        </div>
                      </div>
                      <Skeleton className="h-4 w-full" />
                      <div className="flex flex-wrap gap-2">
                        <Skeleton className="h-6 w-[80px]" />
                        <Skeleton className="h-6 w-[100px]" />
                        <Skeleton className="h-6 w-[90px]" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-[200px]" />
                        <Skeleton className="h-4 w-[150px]" />
                      </div>
                      <Skeleton className="h-8 w-[100px]" />
                    </div>
                  </CardContent>
                </Card>
              ),
            )}
          </motion.div>
        ) : (
          <motion.div
            key="results"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0 }}
            className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-3"}
          >
            {results.length > 0 ? (
              results.map((employee) =>
                viewMode === "grid" ? (
                  <motion.div
                    key={employee.id}
                    variants={itemVariants}
                    whileHover={{ y: -5, transition: { duration: 0.2 } }}
                    className="h-full"
                  >
                    <Card className="overflow-hidden h-full">
                      <CardContent className="p-0 h-full">
                        <div className="p-6 flex flex-col h-full">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-4">
                              <div className="relative">
                                <div className="absolute inset-0 bg-primary/10 rounded-full animate-pulse" />
                                <Avatar className="h-16 w-16 border-2 border-primary/20">
                                  <AvatarImage src={employee.avatar} alt={employee.name} />
                                  <AvatarFallback>{employee.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                              </div>
                              <div>
                                <h3 className="font-semibold text-lg">{employee.name}</h3>
                                <p className="text-muted-foreground">{employee.position}</p>
                              </div>
                            </div>
                            <Badge variant="outline">{employee.department}</Badge>
                          </div>

                          <div className="space-y-3 flex-1">
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Mail className="h-4 w-4 mr-2" />
                              <span className="truncate">{employee.email}</span>
                            </div>
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Phone className="h-4 w-4 mr-2" />
                              <span>{employee.phone}</span>
                            </div>
                            <div className="flex items-center text-sm text-muted-foreground">
                              <MapPin className="h-4 w-4 mr-2" />
                              <span>{employee.location}</span>
                            </div>
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Briefcase className="h-4 w-4 mr-2" />
                              <span>{employee.experience} Jahre Erfahrung</span>
                            </div>
                          </div>

                          <div className="mt-4">
                            <p className="text-sm font-medium mb-2 flex items-center">
                              <Award className="h-4 w-4 mr-1" />
                              Fähigkeiten
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {employee.skills.map((skill, i) => (
                                <Badge
                                  key={i}
                                  variant="secondary"
                                  className="animate-in fade-in"
                                  style={{ animationDelay: `${i * 100}ms` }}
                                >
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          <div className="mt-4 pt-4 border-t">
                            <Button variant="outline" size="sm" className="w-full">
                              Profil anzeigen
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ) : (
                  <motion.div
                    key={employee.id}
                    variants={itemVariants}
                    whileHover={{ x: 5, transition: { duration: 0.2 } }}
                  >
                    <Card className="overflow-hidden">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-12 w-12 border-2 border-primary/20">
                            <AvatarImage src={employee.avatar} alt={employee.name} />
                            <AvatarFallback>{employee.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-semibold">{employee.name}</h3>
                                <p className="text-sm text-muted-foreground">{employee.position}</p>
                              </div>
                              <Badge variant="outline">{employee.department}</Badge>
                            </div>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {employee.skills.slice(0, 3).map((skill, i) => (
                                <Badge
                                  key={i}
                                  variant="secondary"
                                  className="animate-in fade-in"
                                  style={{ animationDelay: `${i * 100}ms` }}
                                >
                                  {skill}
                                </Badge>
                              ))}
                              {employee.skills.length > 3 && (
                                <Badge variant="outline">+{employee.skills.length - 3}</Badge>
                              )}
                            </div>
                          </div>
                          <Button variant="ghost" size="sm">
                            Details
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ),
              )
            ) : query && !isLoading ? (
              <motion.div variants={itemVariants} className="col-span-full text-center py-10">
                <div className="inline-flex items-center justify-center rounded-full bg-muted p-8 mb-4">
                  <Search className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-1">Keine Ergebnisse gefunden</h3>
                <p className="text-muted-foreground">Versuchen Sie andere Suchbegriffe oder Filter</p>
              </motion.div>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>
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

