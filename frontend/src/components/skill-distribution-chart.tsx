"use client"

import { useEffect, useRef } from "react"
import { useTheme } from "next-themes"
import React from 'react';

export function SkillDistributionChart() {
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
    const skills = [
      { name: "JavaScript", value: 85, color: "#3b82f6" },
      { name: "Python", value: 72, color: "#10b981" },
      { name: "React", value: 68, color: "#6366f1" },
      { name: "SQL", value: 64, color: "#f59e0b" },
      { name: "Java", value: 56, color: "#ef4444" },
      { name: "C#", value: 48, color: "#8b5cf6" },
      { name: "TypeScript", value: 42, color: "#ec4899" },
      { name: "Docker", value: 38, color: "#06b6d4" },
    ]

    // Sort skills by value in descending order
    skills.sort((a, b) => b.value - a.value)

    // Chart dimensions
    const chartWidth = rect.width - 40
    const chartHeight = rect.height - 40
    const barHeight = 30
    const barSpacing = 15
    const startX = 120
    const startY = 20

    // Text color based on theme
    const textColor = theme === "dark" ? "#e5e7eb" : "#1f2937"

    // Draw chart
    ctx.clearRect(0, 0, rect.width, rect.height)
    ctx.font = "14px Inter, system-ui, sans-serif"
    ctx.textBaseline = "middle"

    skills.forEach((skill, index) => {
      const y = startY + index * (barHeight + barSpacing)

      // Draw skill name
      ctx.fillStyle = textColor
      ctx.textAlign = "right"
      ctx.fillText(skill.name, startX - 10, y + barHeight / 2)

      // Draw bar background
      ctx.fillStyle = theme === "dark" ? "#374151" : "#f3f4f6"
      ctx.fillRect(startX, y, chartWidth, barHeight)

      // Animate bar drawing
      const animateBar = (progress: number) => {
        const barWidth = (skill.value / 100) * chartWidth * progress

        // Draw bar
        ctx.fillStyle = skill.color
        ctx.fillRect(startX, y, barWidth, barHeight)

        // Draw value
        ctx.fillStyle = "#ffffff"
        ctx.textAlign = "left"
        if (barWidth > 40) {
          ctx.fillText(`${Math.round(skill.value * progress)}%`, startX + 10, y + barHeight / 2)
        } else {
          ctx.fillStyle = textColor
          ctx.fillText(`${Math.round(skill.value * progress)}%`, startX + barWidth + 5, y + barHeight / 2)
        }
      }

      // Animate each bar with a delay based on index
      let progress = 0
      const animationDuration = 1000 // ms
      const startTime = performance.now() + index * 150

      const animate = (currentTime: number) => {
        if (currentTime >= startTime) {
          progress = Math.min(1, (currentTime - startTime) / animationDuration)
          animateBar(progress)

          if (progress < 1) {
            requestAnimationFrame(animate)
          }
        } else {
          requestAnimationFrame(animate)
        }
      }

      requestAnimationFrame(animate)
    })
  }, [theme])

  return (
    <div className="p-4 bg-white rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Skill Distribution</h3>
      <div className="w-full h-full flex items-center justify-center">
        <canvas ref={canvasRef} className="w-full h-full" />
      </div>
    </div>
  )
}
