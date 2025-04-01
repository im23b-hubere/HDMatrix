"use client"
import { motion } from "framer-motion"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { FileText, UserPlus, Award, Edit, Clock } from "lucide-react"
import React from 'react';

interface Activity {
  id: string
  type: "document" | "employee" | "skill" | "profile"
  title: string
  description: string
  timestamp: Date
  user: {
    name: string
    avatar: string
  }
}

export const RecentActivityList: React.FC = () => {
  const activities: Activity[] = [
    {
      id: "1",
      type: "document",
      title: "Projektdokumentation.pdf",
      description: "Neue Version hochgeladen",
      timestamp: new Date(Date.now() - 25 * 60000),
      user: {
        name: "Anna Schmidt",
        avatar: "/placeholder.svg?height=40&width=40",
      },
    },
    {
      id: "2",
      type: "employee",
      title: "Max Mustermann",
      description: "Neuer Mitarbeiter hinzugefügt",
      timestamp: new Date(Date.now() - 2 * 3600000),
      user: {
        name: "Julia Weber",
        avatar: "/placeholder.svg?height=40&width=40",
      },
    },
    {
      id: "3",
      type: "skill",
      title: "React Native",
      description: "Neue Fähigkeit hinzugefügt",
      timestamp: new Date(Date.now() - 5 * 3600000),
      user: {
        name: "Thomas Becker",
        avatar: "/placeholder.svg?height=40&width=40",
      },
    },
    {
      id: "4",
      type: "profile",
      title: "Profil aktualisiert",
      description: "Fähigkeiten und Erfahrungen aktualisiert",
      timestamp: new Date(Date.now() - 8 * 3600000),
      user: {
        name: "Lisa Müller",
        avatar: "/placeholder.svg?height=40&width=40",
      },
    },
    {
      id: "5",
      type: "document",
      title: "Quartalsbericht.xlsx",
      description: "Dokument analysiert",
      timestamp: new Date(Date.now() - 24 * 3600000),
      user: {
        name: "Michael Schneider",
        avatar: "/placeholder.svg?height=40&width=40",
      },
    },
  ]

  const getActivityIcon = (type: Activity["type"]) => {
    switch (type) {
      case "document":
        return <FileText className="h-4 w-4" />
      case "employee":
        return <UserPlus className="h-4 w-4" />
      case "skill":
        return <Award className="h-4 w-4" />
      case "profile":
        return <Edit className="h-4 w-4" />
    }
  }

  const getActivityColor = (type: Activity["type"]) => {
    switch (type) {
      case "document":
        return "bg-blue-500/10 text-blue-500"
      case "employee":
        return "bg-green-500/10 text-green-500"
      case "skill":
        return "bg-amber-500/10 text-amber-500"
      case "profile":
        return "bg-purple-500/10 text-purple-500"
    }
  }

  const formatTime = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 60) {
      return `vor ${diffMins} Minuten`
    } else if (diffMins < 24 * 60) {
      const hours = Math.floor(diffMins / 60)
      return `vor ${hours} Stunden`
    } else {
      const days = Math.floor(diffMins / (60 * 24))
      return `vor ${days} Tagen`
    }
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const item = {
    hidden: { opacity: 0, x: -20 },
    show: { opacity: 1, x: 0 },
  }

  return (
    <div className="p-4 bg-white rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
        {activities.map((activity) => (
          <motion.div
            key={activity.id}
            variants={item}
            className="flex items-start space-x-4 rounded-lg border p-4 transition-colors hover:bg-muted/50"
          >
            <div className={`rounded-full p-2 ${getActivityColor(activity.type)}`}>{getActivityIcon(activity.type)}</div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <p className="font-medium">{activity.title}</p>
                <div className="flex items-center text-xs text-muted-foreground">
                  <Clock className="mr-1 h-3 w-3" />
                  {formatTime(activity.timestamp)}
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{activity.description}</p>
            </div>
            <Avatar className="h-8 w-8">
              <AvatarImage src={activity.user.avatar} alt={activity.user.name} />
              <AvatarFallback>{activity.user.name.charAt(0)}</AvatarFallback>
            </Avatar>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};
