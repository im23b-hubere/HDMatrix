"use client"

import { useState, useEffect } from "react"
import { ThemeProvider } from "@/components/theme-provider"
import { ChatInterface } from "./components/chat-interface"
import { EmployeeSearch } from "./components/employee-search"
import { Dashboard } from "./components/dashboard"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import { Moon, Sun, Menu, X, Search, MessageSquare, LayoutDashboard } from "lucide-react"
import { useMediaQuery } from "@/hooks/use-mobile"
import "./index.css"

function App() {
  const [theme, setTheme] = useState<"light" | "dark">("light")
  const [activeTab, setActiveTab] = useState("dashboard")
  const [menuOpen, setMenuOpen] = useState(false)
  const isMobile = useMediaQuery("(max-width: 768px)")

  // Apply theme class to body for global styling
  useEffect(() => {
    document.body.classList.toggle("dark", theme === "dark")

    // Save theme preference
    localStorage.setItem("talentbridge-theme", theme)
  }, [theme])

  // Load saved theme on initial render
  useEffect(() => {
    const savedTheme = localStorage.getItem("talentbridge-theme") as "light" | "dark" | null
    if (savedTheme) {
      setTheme(savedTheme)
    } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setTheme("dark")
    }
  }, [])

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light")
  }

  const sidebarVariants = {
    open: { x: 0, transition: { type: "spring", stiffness: 300, damping: 30 } },
    closed: { x: "-100%", transition: { type: "spring", stiffness: 300, damping: 30 } },
  }

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
    { id: "search", label: "Mitarbeiter-Suche", icon: <Search className="h-5 w-5" /> },
    { id: "chat", label: "KI-Assistent", icon: <MessageSquare className="h-5 w-5" /> },
  ]

  return (
    <ThemeProvider defaultTheme={theme} storageKey="talentbridge-theme">
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
                    TB
                  </div>
                </div>
                <h1 className="text-xl font-bold">TalentBridge</h1>
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
                    <nav className="space-y-2">
                      {navItems.map((item) => (
                        <Button
                          key={item.id}
                          variant={activeTab === item.id ? "default" : "ghost"}
                          className="w-full justify-start"
                          onClick={() => {
                            setActiveTab(item.id)
                            setMenuOpen(false)
                          }}
                        >
                          <div className="flex items-center gap-2">
                            {item.icon}
                            <span>{item.label}</span>
                          </div>
                        </Button>
                      ))}
                    </nav>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          )}

          {/* Desktop Sidebar */}
          {!isMobile && (
            <div className="w-64 border-r p-4 hidden md:block">
              <nav className="space-y-2 sticky top-20">
                {navItems.map((item) => (
                  <Button
                    key={item.id}
                    variant={activeTab === item.id ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => setActiveTab(item.id)}
                  >
                    <motion.div
                      className="flex items-center gap-2"
                      whileHover={{ x: 5 }}
                      transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </motion.div>
                  </Button>
                ))}
              </nav>
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
                {activeTab === "dashboard" && <Dashboard />}
                {activeTab === "search" && <EmployeeSearch />}
                {activeTab === "chat" && <ChatInterface />}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </ThemeProvider>
  )
}

export default App
