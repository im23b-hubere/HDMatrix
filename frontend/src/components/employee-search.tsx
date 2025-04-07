"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence, useAnimation } from "framer-motion"
import { Search, Filter, X, ChevronDown, ChevronUp, Mail, Phone, MapPin, Briefcase, Award, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton as UISkeletion } from "@/components/ui/skeleton"
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"
import { DatabaseService } from '../services/db-service'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../components/ui/select"
import { 
  Box, 
  Typography, 
  TextField, 
  InputAdornment, 
  Chip, 
  IconButton, 
  MenuItem, 
  Menu, 
  Paper, 
  FormControl, 
  FormControlLabel, 
  Stack, 
  alpha, 
  useTheme, 
  useMediaQuery,
  InputLabel,
  Checkbox, 
  Avatar,
  Skeleton,
  Grid,
  Select as MuiSelect,
  SelectChangeEvent,
  Pagination,
  ListSubheader
} from '@mui/material';
import {
  Sort as SortIcon,
  MoreVert as MoreVertIcon,
  CheckCircle as CheckCircleIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationOnIcon,
  School as SchoolIcon,
  Star as StarIcon,
  Person as PersonIcon
} from '@mui/icons-material';

interface Employee {
    id: number
    vorname: string
    nachname: string
    email: string
    position: string
    abteilung_id: number
    skills: string[]
    education?: string
    profileImage?: string
    rating?: number
    standort?: string
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

const locations = ['Alle', 'Berlin', 'München', 'Hamburg', 'Frankfurt', 'Köln', 'Düsseldorf'];

export function EmployeeSearch() {
    const [searchQuery, setSearchQuery] = useState('')
    const [employees, setEmployees] = useState<Employee[]>([])
    const [departments, setDepartments] = useState<Array<{id: number, name: string, description?: string}>>([])
    const [selectedDepartment, setSelectedDepartment] = useState<string>('all')
    const [selectedSkills, setSelectedSkills] = useState<string[]>([])
    const [selectedLocation, setSelectedLocation] = useState('Alle')
    const [showFilter, setShowFilter] = useState(false)
    const [sortOrder, setSortOrder] = useState<'name' | 'department' | 'rating'>('name')
    const [showSkillsOnly, setShowSkillsOnly] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
    const theme = useTheme()
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
    
    // Paginierung
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)
    const [totalResults, setTotalResults] = useState(0)
    const [totalPages, setTotalPages] = useState(1)

    // Funktion zum Ausführen der Suche
    const performSearch = async () => {
        setIsLoading(true)
        try {
            const result = await DatabaseService.searchEmployees(searchQuery, {
                department: selectedDepartment === 'all' ? undefined : parseInt(selectedDepartment),
                skills: selectedSkills,
                location: selectedLocation !== 'Alle' ? selectedLocation : undefined,
                page: currentPage,
                page_size: pageSize
            })
            setEmployees(result.employees)
            setTotalResults(result.total)
            setTotalPages(result.total_pages)
        } catch (error) {
            console.error('Error searching employees:', error)
        } finally {
            setIsLoading(false)
        }
    }

    // Suche automatisch ausführen, wenn sich die Seitenparameter ändern
    useEffect(() => {
        performSearch()
    }, [currentPage, pageSize, selectedSkills])

    // Beim ersten Laden Abteilungen abrufen und die Suche ausführen
    useEffect(() => {
        async function loadInitialData() {
            try {
                const depts = await DatabaseService.getDepartments()
                setDepartments(depts)
            } catch (error) {
                console.error('Fehler beim Laden der Abteilungen:', error)
            }
            
            performSearch()
        }
        
        loadInitialData()
    }, [])

    const handleDepartmentChange = (event: SelectChangeEvent<string>) => {
        setSelectedDepartment(event.target.value)
        setCurrentPage(1) // Zurück zur ersten Seite bei Filter-Änderung
        performSearch()
    }

    const handleLocationChange = (event: SelectChangeEvent<string>) => {
        setSelectedLocation(event.target.value)
        setCurrentPage(1) // Zurück zur ersten Seite bei Filter-Änderung
        performSearch()
    }

    const handleSearch = () => {
        setCurrentPage(1) // Zurück zur ersten Seite bei neuer Suche
        performSearch()
    }

    const handleSkillClick = (skill: string) => {
        setSelectedSkills(prev => 
            prev.includes(skill) 
                ? prev.filter(s => s !== skill)
                : [...prev, skill]
        )
        setCurrentPage(1) // Zurück zur ersten Seite bei Filter-Änderung
    }

    // Funktion zum Abrufen der Fähigkeiten basierend auf der ausgewählten Abteilung
    const getDepartmentSkills = () => {
        if (selectedDepartment === 'all') {
            // Bei "Alle Abteilungen" zeigen wir alle Fähigkeiten an
            return Object.values(SKILL_CATEGORIES).flat()
        }
        
        const department = departments.find(dept => dept.id.toString() === selectedDepartment)
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

    const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget)
    }

    const handleMenuClose = () => {
        setAnchorEl(null)
    }

    const handleClearFilters = () => {
        setSearchQuery('')
        setSelectedDepartment('all')
        setSelectedSkills([])
        setSelectedLocation('Alle')
        setShowSkillsOnly(false)
        setCurrentPage(1) // Zurück zur ersten Seite bei Filter-Reset
        performSearch()
    }

    const handleSort = (order: 'name' | 'department' | 'rating') => {
        setSortOrder(order)
        handleMenuClose()
    }

    const handlePageChange = (event: React.ChangeEvent<unknown>, page: number) => {
        setCurrentPage(page)
    }

    const handlePageSizeChange = (event: SelectChangeEvent<string>) => {
        const newSize = parseInt(event.target.value)
        setPageSize(newSize)
        setCurrentPage(1) // Zurück zur ersten Seite bei Änderung der Seitengröße
    }

    const getDepartmentNameById = (id: number) => {
        const dept = departments.find(d => d.id === id)
        return dept ? dept.name : 'Unbekannte Abteilung'
    }

    // Sortiere die Mitarbeiter basierend auf der ausgewählten Sortierung
    const sortedEmployees = [...employees].sort((a, b) => {
        if (sortOrder === 'name') return (a.vorname + a.nachname).localeCompare(b.vorname + b.nachname)
        if (sortOrder === 'department') return a.abteilung_id - b.abteilung_id
        if (sortOrder === 'rating' && a.rating && b.rating) return b.rating - a.rating
        return 0
    })

    // Für die Skills-Dropdown-Komponente: Extrem vereinfacht, native DOM-Elemente
    const SkillsDropdown = () => {
        const [open, setOpen] = useState(false);
        const dropdownRef = React.useRef<HTMLDivElement>(null);
        
        // Skills nach Anzahl begrenzen, damit das Dropdown wie im Bild aussieht
        const allSkills = React.useMemo(() => {
            return [
                { id: 'all', name: 'Alle' },
                { id: 'javascript', name: 'JavaScript' },
                { id: 'typescript', name: 'TypeScript' },
                { id: 'python', name: 'Python' },
                { id: 'java', name: 'Java' },
                { id: 'csharp', name: 'C#' },
                { id: 'react', name: 'React' },
                { id: 'angular', name: 'Angular' }
            ];
        }, []);
        
        // Außerhalb des Dropdowns klicken zum Schließen
        useEffect(() => {
            const handleClickOutside = (event: MouseEvent) => {
                if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                    setOpen(false);
                }
            };
            
            if (open) {
                document.addEventListener('mousedown', handleClickOutside);
            }
            return () => {
                document.removeEventListener('mousedown', handleClickOutside);
            };
        }, [open]);
        
        const handleSkillSelect = (skillId: string) => {
            if (skillId === 'all') {
                setSelectedSkills([]);
            } else {
                const skill = allSkills.find(s => s.id === skillId)?.name || '';
                if (skill && !selectedSkills.includes(skill)) {
                    setSelectedSkills(prev => [...prev, skill]);
                } else if (skill) {
                    setSelectedSkills(prev => prev.filter(s => s !== skill));
                }
            }
            setCurrentPage(1);
        };
        
        return (
            <div ref={dropdownRef} style={{ position: 'relative' }}>
                <div 
                    onClick={() => setOpen(!open)}
                    style={{
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        padding: '8px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        width: '180px',
                        backgroundColor: 'white',
                        cursor: 'pointer',
                    }}
                >
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {selectedSkills.length > 0 ? `${selectedSkills.length} Skills` : 'Skills...'}
                    </span>
                    <ChevronDown size={16} />
                </div>

                {open && (
                    <div 
                        style={{
                            position: 'absolute',
                            top: 'calc(100% + 4px)',
                            left: 0,
                            width: '200px',
                            maxHeight: '300px',
                            overflowY: 'auto',
                            backgroundColor: 'white',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                            borderRadius: '4px',
                            zIndex: 1000,
                        }}
                    >
                        {allSkills.map((skill) => (
                            <div 
                                key={skill.id}
                                onClick={() => handleSkillSelect(skill.id)}
                                style={{
                                    padding: '12px 16px',
                                    cursor: 'pointer',
                                    fontWeight: skill.id === 'all' ? 
                                        (selectedSkills.length === 0 ? 'bold' : 'normal') : 
                                        (selectedSkills.includes(skill.name) ? 'bold' : 'normal'),
                                    borderBottom: skill.id === 'all' ? '1px solid #eee' : 'none',
                                    backgroundColor: 'white',
                                }}
                                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
                            >
                                {skill.name}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    // Anpassung der Erfahrungs- und Verfügbarkeits-Dropdowns im gleichen Stil
    const ExperienceDropdown = () => {
        // Simple Experience Dropdown
        return (
            <Box
                sx={{
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    py: 1,
                    px: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: 180,
                    bgcolor: 'white',
                    cursor: 'pointer',
                    '&:hover': {
                        borderColor: '#999'
                    }
                }}
            >
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    Er...
                </span>
                <ChevronDown size={16} />
            </Box>
        );
    };

    const AvailabilityDropdown = () => {
        // Simple Availability Dropdown
        return (
            <Box
                sx={{
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    py: 1,
                    px: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: 180,
                    bgcolor: 'white',
                    cursor: 'pointer',
                    '&:hover': {
                        borderColor: '#999'
                    }
                }}
            >
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    Ve...
                </span>
                <ChevronDown size={16} />
            </Box>
        );
    };

    return (
        <Box>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 1 }}>
                    Mitarbeitersuche
                </Typography>
                <Typography color="text.secondary" sx={{ mb: 3 }}>
                    Finde Mitarbeiter anhand von Name, Position, Fähigkeiten oder Abteilung
                </Typography>
                
                <Paper sx={{ mb: 3, p: 1, borderRadius: 2 }}>
                    <Tabs defaultValue="search" className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="search">Mitarbeitersuche</TabsTrigger>
                            <TabsTrigger value="departments">Abteilungen</TabsTrigger>
                            <TabsTrigger value="projects">Projekte</TabsTrigger>
                        </TabsList>
                        <TabsContent value="search" className="p-2">
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
                                <TextField
                                    placeholder="Suche nach Namen, Position oder Fähigkeiten..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    variant="outlined"
                                    fullWidth
                                    sx={{ 
                                        maxWidth: 500,
                                        flexGrow: 1,
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 2,
                                            bgcolor: 'background.paper',
                                        }
                                    }}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <Search className="h-4 w-4 text-muted-foreground" />
                                            </InputAdornment>
                                        ),
                                        endAdornment: searchQuery && (
                                            <InputAdornment position="end">
                                                <IconButton size="small" onClick={() => setSearchQuery('')}>
                                                    <X className="h-4 w-4 text-muted-foreground" />
                                                </IconButton>
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                                
                                <Button 
                                    onClick={() => setShowFilter(!showFilter)}
                                    variant="outline"
                                    className="gap-2"
                                >
                                    <Filter className="h-4 w-4" />
                                    Filter
                                </Button>
                                
                        <Button 
                                    onClick={handleMenuClick}
                                    variant="outline"
                                    className="gap-2"
                                >
                                    <SortIcon fontSize="small" style={{ marginRight: 5 }} />
                                    Sortieren
                        </Button>
                                
                                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 3 }}>
                                    <Typography sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                                        Suche nach Mitarbeitern mit bestimmten Fähigkeiten
                                    </Typography>
                                    
                                    <Box sx={{ display: 'flex', gap: 2, mt: 2, alignItems: 'center' }}>
                                        <SkillsDropdown />
                                        <ExperienceDropdown />
                                        <AvailabilityDropdown />
                                        
                                        <Button 
                                    variant="default"
                                            className="px-4 py-1 h-9 rounded-md flex items-center gap-2"
                                            onClick={handleSearch}
                                        >
                                            <Search size={16} />
                                            Suchen
                                        </Button>
                                    </Box>
                                </Box>
                            </Box>
                            
                            {showFilter && (
                                <Paper 
                                    elevation={0} 
                                    sx={{ 
                                        mt: 2, 
                                        p: 3, 
                                        borderRadius: 2,
                                        border: '1px solid',
                                        borderColor: 'divider'
                                    }}
                                >
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                            Filter
                                        </Typography>
                                        <Button 
                                            onClick={handleClearFilters}
                                            variant="soft"
                                            size="sm"
                                        >
                                            Zurücksetzen
                                        </Button>
                                    </Box>
                                    
                                    <Grid container spacing={3}>
                                        <Grid item xs={12} sm={6} md={3}>
                                            <FormControl fullWidth size="small">
                                                <InputLabel id="department-select-label">Abteilung</InputLabel>
                                                <MuiSelect
                                                    labelId="department-select-label"
                                                    id="department-select"
                                                    value={selectedDepartment}
                                                    label="Abteilung"
                                                    onChange={handleDepartmentChange}
                                                >
                                                    <MenuItem value="all">Alle Abteilungen</MenuItem>
                                                    {departments.map((department) => (
                                                        <MenuItem key={department.id} value={department.id.toString()}>
                                                            {department.name}
                                                        </MenuItem>
                                                    ))}
                                                </MuiSelect>
                                            </FormControl>
                                        </Grid>
                                        
                                        <Grid item xs={12} sm={6} md={3}>
                                            <FormControl fullWidth size="small">
                                                <InputLabel id="location-select-label">Standort</InputLabel>
                                                <MuiSelect
                                                    labelId="location-select-label"
                                                    id="location-select"
                                                    value={selectedLocation}
                                                    label="Standort"
                                                    onChange={handleLocationChange}
                                                >
                                                    {locations.map((location) => (
                                                        <MenuItem key={location} value={location}>
                                                            {location}
                                                        </MenuItem>
                                                    ))}
                                                </MuiSelect>
                                            </FormControl>
                                        </Grid>
                                        
                                        <Grid item xs={12} sm={6} md={3}>
                                            <FormControlLabel
                                                control={
                                                    <Checkbox 
                                                        checked={showSkillsOnly} 
                                                        onChange={(e) => setShowSkillsOnly(e.target.checked)}
                                                        color="primary"
                                                    />
                                                }
                                                label="Nur mit Skills anzeigen"
                                            />
                                        </Grid>
                                    </Grid>
                                </Paper>
                            )}
                            
                            {(searchQuery || selectedDepartment !== 'all' || selectedLocation !== 'Alle' || selectedSkills.length > 0) && (
                                <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                    {searchQuery && (
                                        <Chip 
                                            label={`Suche: ${searchQuery}`} 
                                            onDelete={() => setSearchQuery('')}
                                            color="primary"
                                            variant="outlined"
                                            size="small"
                                        />
                                    )}
                                    {selectedDepartment !== 'all' && (
                                        <Chip 
                                            label={`Abteilung: ${departments.find(d => d.id.toString() === selectedDepartment)?.name || ''}`} 
                                            onDelete={() => setSelectedDepartment('all')}
                                            color="primary"
                                            variant="outlined"
                                            size="small"
                                        />
                                    )}
                                    {selectedLocation !== 'Alle' && (
                                        <Chip 
                                            label={`Standort: ${selectedLocation}`} 
                                            onDelete={() => setSelectedLocation('Alle')}
                                            color="primary"
                                            variant="outlined"
                                            size="small"
                                        />
                                    )}
                                    {selectedSkills.map(skill => (
                                        <Chip 
                                key={skill}
                                            label={`Skill: ${skill}`} 
                                            onDelete={() => handleSkillClick(skill)}
                                            color="primary"
                                            variant="outlined"
                                            size="small"
                                        />
                                    ))}
                                </Box>
                            )}
                        </TabsContent>
                        <TabsContent value="departments" className="p-2">
                            <Box sx={{ p: 2, textAlign: 'center' }}>
                                <Typography variant="body2" color="text.secondary">
                                    Abteilungsübersicht in Entwicklung...
                                </Typography>
                            </Box>
                        </TabsContent>
                        <TabsContent value="projects" className="p-2">
                            <Box sx={{ p: 2, textAlign: 'center' }}>
                                <Typography variant="body2" color="text.secondary">
                                    Projektübersicht in Entwicklung...
                                </Typography>
                            </Box>
                        </TabsContent>
                    </Tabs>
                </Paper>
            </Box>
            
                    {isLoading ? (
                <Grid container spacing={3}>
                    {[1, 2, 3, 4, 5, 6].map((skeleton) => (
                        <Grid item xs={12} sm={6} md={4} key={skeleton}>
                            <Card>
                                <CardContent>
                                    <Box sx={{ display: 'flex', mb: 2 }}>
                                        <Box sx={{ width: 60, height: 60, borderRadius: '50%' }}>
                                            <Skeleton variant="circular" width={60} height={60} />
                                        </Box>
                                        <Box sx={{ ml: 2, flex: 1 }}>
                                            <Skeleton variant="text" sx={{ width: '70%', height: 32 }} />
                                            <Skeleton variant="text" sx={{ width: '50%', height: 24 }} />
                                        </Box>
                                    </Box>
                                    <Skeleton variant="text" sx={{ width: '90%' }} />
                                    <Skeleton variant="text" sx={{ width: '60%' }} />
                                    <Box sx={{ mt: 2 }}>
                                        <Skeleton variant="rectangular" sx={{ height: 32 }} />
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            ) : sortedEmployees.length === 0 ? (
                <Box sx={{ 
                    textAlign: 'center', 
                    py: 10, 
                    px: 2,
                    bgcolor: 'background.paper',
                    borderRadius: 2,
                    border: '1px dashed',
                    borderColor: 'divider'
                }}>
                    <Typography variant="h6" gutterBottom>
                        Keine Mitarbeiter gefunden
                    </Typography>
                    <Typography color="text.secondary">
                        Versuche es mit anderen Suchbegriffen oder Filtern.
                    </Typography>
                    <Button 
                        variant="outline"
                        onClick={handleClearFilters}
                        className="mt-3"
                    >
                        Filter zurücksetzen
                    </Button>
                </Box>
            ) : (
                <>
                    <Grid container spacing={3}>
                        {sortedEmployees.map((employee) => (
                            <Grid item xs={12} sm={6} md={4} key={employee.id}>
                                <Card>
                                    <CardContent className="pb-0">
                                        <Box sx={{ display: 'flex', mb: 3 }}>
                                            <Avatar
                                                alt={`${employee.vorname} ${employee.nachname}`}
                                                src={employee.profileImage}
                                                sx={{ 
                                                    width: 60, 
                                                    height: 60,
                                                    bgcolor: 'primary.main',
                                                    fontSize: '1.5rem',
                                                    fontWeight: 600,
                                                    flexShrink: 0
                                                }}
                                            >
                                                {employee.vorname.charAt(0)}
                                            </Avatar>
                                            <Box sx={{ ml: 2, overflow: 'hidden', width: 'calc(100% - 75px)' }}>
                                                <Typography 
                                                    variant="h6" 
                                                    component="h3" 
                                                    sx={{ 
                                                        fontWeight: 600,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        mb: 0.5
                                                    }}
                                                >
                                                    <Box component="span" sx={{ 
                                                        maxWidth: 'calc(100% - 40px)', 
                                                        overflow: 'hidden', 
                                                        textOverflow: 'ellipsis', 
                                                        whiteSpace: 'nowrap',
                                                        display: 'block'
                                                    }}>
                                                        {employee.vorname} {employee.nachname}
                                                    </Box>
                                                    {employee.rating && (
                                                        <Box sx={{ 
                                                            display: 'flex', 
                                                            alignItems: 'center', 
                                                            ml: 1,
                                                            color: 'warning.main',
                                                            fontSize: '0.875rem',
                                                            flexShrink: 0
                                                        }}>
                                                            <StarIcon sx={{ fontSize: '1rem', mr: 0.5 }} />
                                                            {employee.rating}
                                                        </Box>
                                                    )}
                                                </Typography>
                                                <Typography 
                                                    variant="body2" 
                                                    color="text.secondary" 
                                                    noWrap
                                                    sx={{ 
                                                        display: 'flex', 
                                                        alignItems: 'center'
                                                    }}
                                                >
                                                    {employee.position}
                                                </Typography>
                                                <Chip 
                                                    label={getDepartmentNameById(employee.abteilung_id)} 
                                                    size="small" 
                                                    sx={{ 
                                                        mt: 1, 
                                                        height: 24, 
                                                        fontSize: '0.75rem',
                                                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                                                        color: 'primary.main',
                                                        fontWeight: 600,
                                                        maxWidth: '100%',
                                                        '& .MuiChip-label': {
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            whiteSpace: 'nowrap',
                                                            padding: '0 8px'
                                                        }
                                                    }} 
                                                />
                                            </Box>
                                        </Box>
                                        
                                        <Stack spacing={1} sx={{ mb: 2 }}>
                                            <Box sx={{ 
                                                display: 'flex', 
                                                alignItems: 'center',
                                                color: 'text.secondary',
                                                fontSize: '0.875rem'
                                            }}>
                                                <EmailIcon fontSize="small" sx={{ mr: 1, opacity: 0.7, flexShrink: 0 }} />
                                                <Typography variant="body2" noWrap sx={{ width: '100%' }}>{employee.email}</Typography>
                                            </Box>
                                            {employee.education && (
                                                <Box sx={{ 
                                                    display: 'flex', 
                                                    alignItems: 'center',
                                                    color: 'text.secondary',
                                                    fontSize: '0.875rem'
                                                }}>
                                                    <SchoolIcon fontSize="small" sx={{ mr: 1, opacity: 0.7, flexShrink: 0 }} />
                                                    <Typography variant="body2" noWrap sx={{ width: '100%' }}>{employee.education}</Typography>
                                                </Box>
                                            )}
                                            {employee.standort && (
                                                <Box sx={{ 
                                                    display: 'flex', 
                                                    alignItems: 'center',
                                                    color: 'text.secondary',
                                                    fontSize: '0.875rem'
                                                }}>
                                                    <LocationOnIcon fontSize="small" sx={{ mr: 1, opacity: 0.7, flexShrink: 0 }} />
                                                    <Typography variant="body2" noWrap sx={{ width: '100%' }}>{employee.standort}</Typography>
                                                </Box>
                                            )}
                                        </Stack>
                                        
                                        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                                            Fähigkeiten
                                        </Typography>
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, maxHeight: '80px', overflow: 'auto' }}>
                                            {employee.skills.map((skill) => (
                                                <Chip 
                                                    key={skill} 
                                                    label={skill} 
                                                    size="small"
                                                    sx={{ 
                                                        height: 24, 
                                                        fontSize: '0.75rem',
                                                        bgcolor: 'background.default',
                                                        margin: '0 2px 4px 0'
                                                    }}
                                                />
                                            ))}
                                        </Box>
                                    </CardContent>
                                    <CardFooter className="flex justify-between">
                                        <Button size="sm" variant="soft">Profil</Button>
                                        <Button size="sm">Kontaktieren</Button>
                                    </CardFooter>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                    
                    {/* Paginierung */}
                    {totalResults > 0 && (
                        <Box sx={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            mt: 4,
                            px: 2
                        }}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Typography variant="body2" color="text.secondary" sx={{ mr: 2 }}>
                                    {`${Math.min((currentPage - 1) * pageSize + 1, totalResults)} - ${Math.min(currentPage * pageSize, totalResults)} von ${totalResults} Ergebnissen`}
                                </Typography>
                                <FormControl size="small" sx={{ minWidth: 120 }}>
                                    <MuiSelect
                                        value={pageSize.toString()}
                                        onChange={handlePageSizeChange}
                                        displayEmpty
                                        inputProps={{ 'aria-label': 'items per page' }}
                                        sx={{ height: 32 }}
                                    >
                                        <MenuItem value="5">5 pro Seite</MenuItem>
                                        <MenuItem value="10">10 pro Seite</MenuItem>
                                        <MenuItem value="25">25 pro Seite</MenuItem>
                                        <MenuItem value="50">50 pro Seite</MenuItem>
                                    </MuiSelect>
                                </FormControl>
                            </Box>
                            
                            <Pagination 
                                count={totalPages} 
                                page={currentPage}
                                onChange={handlePageChange}
                                variant="outlined" 
                                shape="rounded"
                                color="primary"
                                size="medium"
                            />
                        </Box>
                    )}
                </>
            )}
        </Box>
    )
}

