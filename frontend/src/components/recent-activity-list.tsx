"use client"

import { motion } from "framer-motion"
import { FileText, User, Award, Clock } from "lucide-react"

const activities = [
  {
    id: 1,
    type: "document",
    title: "Projektdokumentation aktualisiert",
    user: "Maria Schmidt",
    time: "vor 5 Minuten",
    icon: FileText,
  },
  {
    id: 2,
    type: "skill",
    title: "Neue Fähigkeit: React Native",
    user: "Thomas Müller",
    time: "vor 15 Minuten",
    icon: Award,
  },
  {
    id: 3,
    type: "profile",
    title: "Profil aktualisiert",
    user: "Sarah Weber",
    time: "vor 30 Minuten",
    icon: User,
  },
  {
    id: 4,
    type: "document",
    title: "Neues Zertifikat hochgeladen",
    user: "Michael Wagner",
    time: "vor 1 Stunde",
    icon: FileText,
  },
]

export function RecentActivityList() {
  return (
    <div className="space-y-4">
      {activities.map((activity, index) => (
        <motion.div
          key={activity.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="flex items-center space-x-4 rounded-lg border p-4"
        >
          <div className="rounded-full bg-primary/10 p-2">
            <activity.icon className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 space-y-1">
            <p className="text-sm font-medium">{activity.title}</p>
            <div className="flex items-center text-sm text-muted-foreground">
              <User className="mr-1 h-3 w-3" />
              <span>{activity.user}</span>
              <span className="mx-2">•</span>
              <Clock className="mr-1 h-3 w-3" />
              <span>{activity.time}</span>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}
