"use client"

import { useEffect, useRef } from "react"
import { useTheme } from "next-themes"
import React from 'react';

export function DepartmentChart() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { theme } = useTheme()

  useEffect(() => {
    if (!canvasRef.current) return

    const ctx = canvasRef.current.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions with higher resolution for retina displays
    const dpr = window.devicePixelRatio || 1
    const rect = canvasRef.current.getBoundingClientRect()
    canvasRef.current.width = rect.width * dpr
    canvasRef.current.height = rect.height * dpr
    ctx.scale(dpr, dpr)

    // Reset canvas size in style
    canvasRef.current.style.width = `${rect.width}px`
    canvasRef.current.style.height = `${rect.height}px`

    // Data for the chart
    const departments = [
      { name: "Entwicklung", employees: 42, skills: 120, color: "#3b82f6" },
      { name: "Marketing", employees: 28, skills: 85, color: "#10b981" },
      { name: "Vertrieb", employees: 35, skills: 65, color: "#f59e0b" },
      { name: "Personal", employees: 18, skills: 45, color: "#ef4444" },
      { name: "Finanzen", employees: 12, skills: 30, color: "#8b5cf6" },
      { name: "Support", employees: 22, skills: 55, color: "#06b6d4" },
    ]

    // Chart dimensions
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    const radius = Math.min(centerX, centerY) - 40

    // Text color based on theme
    const textColor = theme === "dark" ? "#e5e7eb" : "#1f2937"
    const labelBgColor = theme === "dark" ? "rgba(30, 41, 59, 0.8)" : "rgba(255, 255, 255, 0.8)"

    // Calculate total employees for percentage
    const totalEmployees = departments.reduce((sum, dept) => sum + dept.employees, 0)

    // Draw pie chart
    let startAngle = 0

    departments.forEach((dept, index) => {
      // Calculate angle
      const sliceAngle = (dept.employees / totalEmployees) * 2 * Math.PI
      const endAngle = startAngle + sliceAngle
      const midAngle = startAngle + sliceAngle / 2

      // Animate slice drawing
      const animateSlice = (progress: number) => {
        const currentEndAngle = startAngle + sliceAngle * progress

        // Draw slice
        ctx.beginPath()
        ctx.moveTo(centerX, centerY)
        ctx.arc(centerX, centerY, radius, startAngle, currentEndAngle)
        ctx.closePath()
        ctx.fillStyle = dept.color
        ctx.fill()

        // Draw label if animation is complete
        if (progress === 1) {
          // Calculate label position
          const labelRadius = radius * 0.7
          const labelX = centerX + Math.cos(midAngle) * labelRadius
          const labelY = centerY + Math.sin(midAngle) * labelRadius

          // Draw label background
          ctx.beginPath()
          ctx.arc(labelX, labelY, 25, 0, 2 * Math.PI)
          ctx.fillStyle = labelBgColor
          ctx.fill()
          ctx.strokeStyle = dept.color
          ctx.lineWidth = 2
          ctx.stroke()

          // Draw label text
          ctx.fillStyle = textColor
          ctx.font = "bold 14px Inter, system-ui, sans-serif"
          ctx.textAlign = "center"
          ctx.textBaseline = "middle"
          ctx.fillText(`${dept.employees}`, labelX, labelY)

          // Draw department name
          const nameRadius = radius + 20
          const nameX = centerX + Math.cos(midAngle) * nameRadius
          const nameY = centerY + Math.sin(midAngle) * nameRadius

          ctx.font = "12px Inter, system-ui, sans-serif"
          ctx.fillStyle = textColor
          ctx.fillText(dept.name, nameX, nameY)
        }
      }

      // Animate each slice with a delay based on index
      let progress = 0
      const animationDuration = 1000 // ms
      const startTime = performance.now() + index * 150

      const animate = (currentTime: number) => {
        if (currentTime >= startTime) {
          progress = Math.min(1, (currentTime - startTime) / animationDuration)
          animateSlice(progress)

          if (progress < 1) {
            requestAnimationFrame(animate)
          }
        } else {
          requestAnimationFrame(animate)
        }
      }

      requestAnimationFrame(animate)

      // Update start angle for next slice
      startAngle = endAngle
    })

    // Draw center circle
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius * 0.4, 0, 2 * Math.PI)
    ctx.fillStyle = theme === "dark" ? "#1e293b" : "#ffffff"
    ctx.fill()
    ctx.strokeStyle = theme === "dark" ? "#334155" : "#e2e8f0"
    ctx.lineWidth = 2
    ctx.stroke()

    // Draw total in center
    ctx.fillStyle = textColor
    ctx.font = "bold 24px Inter, system-ui, sans-serif"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillText(totalEmployees.toString(), centerX, centerY - 10)

    ctx.font = "14px Inter, system-ui, sans-serif"
    ctx.fillText("Mitarbeiter", centerX, centerY + 15)
  }, [theme])

  return (
    <div className="p-4 bg-white rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Department Distribution</h3>
      <div className="w-full h-full flex items-center justify-center">
        <canvas ref={canvasRef} className="w-full h-full" />
      </div>
    </div>
  )
}
