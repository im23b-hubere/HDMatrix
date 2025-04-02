"use client"

import React, { useState } from "react"
import { ThemeProvider, createTheme } from "@mui/material"
import { ChatInterface } from "./components/chat-interface"
import { EmployeeSearch } from "./components/employee-search"
import { Dashboard } from "./components/dashboard"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import { Moon, Sun, Menu, X, Search, MessageSquare, LayoutDashboard, FileText, FileSpreadsheet, Layout, Bot } from "lucide-react"
import { useMediaQuery } from "@/hooks/use-mobile"
import "./index.css"
import { TemplateManager } from "@/components"
import { CVManager } from "./components/cv/CVManager"
import { Navigation } from './components/Navigation'
import { Box, CssBaseline } from '@mui/material'
import { CV } from './types/cv'

function App() {
  const [theme, setTheme] = useState<"light" | "dark">("light")
  const [activeTab, setActiveTab] = useState("dashboard")
  const [menuOpen, setMenuOpen] = useState(false)
  const isMobile = useMediaQuery("(max-width: 768px)")
  const [cvs, setCVs] = useState<CV[]>([])

  const muiTheme = createTheme({
    palette: {
      mode: theme,
    },
  })

  // Apply theme class to body for global styling
  React.useEffect(() => {
    document.body.classList.toggle("dark", theme === "dark")
  }, [theme])

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light")
  }

  const sidebarVariants = {
    open: { x: 0, transition: { type: "spring", stiffness: 300, damping: 30 } },
    closed: { x: "-100%", transition: { type: "spring", stiffness: 300, damping: 30 } },
  }

  const navItems = [
    { label: 'Dashboard', icon: Layout, value: 'dashboard' },
    { label: 'CV Manager', icon: FileText, value: 'cv' },
    { label: 'Employee Search', icon: Search, value: 'employee-search' },
    { label: 'AI Assistant', icon: Bot, value: 'ai-assistant' },
  ]

  const handleSaveCV = (cv: CV) => {
    const existingIndex = cvs.findIndex((c) => c.id === cv.id)
    if (existingIndex >= 0) {
      const updatedCVs = [...cvs]
      updatedCVs[existingIndex] = cv
      setCVs(updatedCVs)
    } else {
      setCVs([...cvs, cv])
    }
  }

  const handleDeleteCV = (cvId: string) => {
    setCVs(cvs.filter((cv) => cv.id !== cvId))
  }

  const handleDuplicateCV = (cvId: string) => {
    const cvToDuplicate = cvs.find((cv) => cv.id === cvId)
    if (cvToDuplicate) {
      const duplicatedCV: CV = {
        ...cvToDuplicate,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      setCVs([...cvs, duplicatedCV])
    }
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'cv':
        return (
          <CVManager
            cvs={cvs}
            onSave={handleSaveCV}
            onDelete={handleDeleteCV}
            onDuplicate={handleDuplicateCV}
            severity="success"
          />
        )
      case 'dashboard':
        return <Dashboard />
      case 'employee-search':
        return <EmployeeSearch />
      case 'ai-assistant':
        return <ChatInterface />
      default:
        return null
    }
  }

  return (
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 flex flex-col">
        {/* Header */}
        <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
          <div className="container flex h-16 items-center justify-between px-4">
            <div className="flex items-center gap-2">
              {isMobile && (
                <Button variant="ghost" size="icon" onClick={() => setMenuOpen(!menuOpen)}>
                  {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </Button>
              )}
              <motion.div
                className="flex items-center gap-2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="relative h-8 w-8">
                  <motion.div
                    className="absolute inset-0 bg-primary rounded-md"
                    animate={{
                      rotate: [0, 10, 0, -10, 0],
                      scale: [1, 1.1, 1, 1.1, 1],
                    }}
                    transition={{
                      duration: 5,
                      repeat: Number.POSITIVE_INFINITY,
                      repeatType: "reverse",
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center text-primary-foreground font-bold">
                    HR
                  </div>
                </div>
                <h1 className="text-xl font-bold">HRMatrix</h1>
              </motion.div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={toggleTheme}>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={theme}
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 20, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                  </motion.div>
                </AnimatePresence>
              </Button>
            </div>
          </div>
        </header>

        <div className="flex flex-1">
          {/* Mobile Sidebar */}
          {isMobile && (
            <AnimatePresence>
              {menuOpen && (
                <>
                  <motion.div
                    className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setMenuOpen(false)}
                  />
                  <motion.div
                    className="fixed top-16 left-0 bottom-0 w-64 bg-background border-r z-50 p-4"
                    variants={sidebarVariants}
                    initial="closed"
                    animate="open"
                    exit="closed"
                  >
                    <Navigation
                      items={navItems}
                      activeItem={activeTab}
                      onItemSelect={setActiveTab}
                      isDarkMode={theme === "dark"}
                      onThemeToggle={toggleTheme}
                    />
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          )}

          {/* Desktop Sidebar */}
          {!isMobile && (
            <div className="w-64 border-r p-4 hidden md:block">
              <Navigation
                items={navItems}
                activeItem={activeTab}
                onItemSelect={setActiveTab}
                isDarkMode={theme === "dark"}
                onThemeToggle={toggleTheme}
              />
            </div>
          )}

          {/* Main Content */}
          <main className="flex-1 container py-6 md:py-10 px-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="w-full max-w-5xl mx-auto"
              >
                {renderContent()}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </ThemeProvider>
  )
}

export default App
