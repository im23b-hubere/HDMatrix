"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Users, Briefcase, Award, TrendingUp, Clock, FileText, ChevronRight } from "lucide-react";
import { SkillDistributionChart } from "@/components/skill-distribution-chart";
import { DepartmentChart } from "@/components/department-chart";
import { RecentActivityList } from "@/components/recent-activity-list";

export function Dashboard() {
  const [progress, setProgress] = useState(0);
  const [activeEmployees, setActiveEmployees] = useState(0);
  const [totalSkills, setTotalSkills] = useState(0);
  const [documentsAnalyzed, setDocumentsAnalyzed] = useState(0);

  useEffect(() => {
    // Animate stats on load
    const timer = setTimeout(() => setProgress(78), 500);

    const employeeCounter = setInterval(() => {
      setActiveEmployees((prev) => {
        if (prev < 142) return prev + 1;
        clearInterval(employeeCounter);
        return prev;
      });
    }, 20);

    const skillsCounter = setInterval(() => {
      setTotalSkills((prev) => {
        if (prev < 320) return prev + 2;
        clearInterval(skillsCounter);
        return prev;
      });
    }, 10);

    const docsCounter = setInterval(() => {
      setDocumentsAnalyzed((prev) => {
        if (prev < 56) return prev + 1;
        clearInterval(docsCounter);
        return prev;
      });
    }, 30);

    return () => {
      clearTimeout(timer);
      clearInterval(employeeCounter);
      clearInterval(skillsCounter);
      clearInterval(docsCounter);
    };
  }, []);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Übersicht über Mitarbeiter, Fähigkeiten und Dokumente</p>
        </div>
        <Button>
          <FileText className="mr-2 h-4 w-4" />
          Bericht erstellen
        </Button>
      </div>

      {/* Stats Cards */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        variants={container}
        initial="hidden"
        animate="show"
      >
        <motion.div variants={item}>
          <Card className="overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Aktive Mitarbeiter</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <div className="mr-4 rounded-full bg-primary/10 p-2">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div className="text-2xl font-bold">{activeEmployees}</div>
              </div>
              <div className="mt-4 flex items-center text-sm text-muted-foreground">
                <TrendingUp className="mr-1 h-4 w-4 text-green-500" />
                <span className="text-green-500 font-medium">+12%</span>
                <span className="ml-1">seit letztem Monat</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Erfasste Fähigkeiten</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <div className="mr-4 rounded-full bg-blue-500/10 p-2">
                  <Award className="h-6 w-6 text-blue-500" />
                </div>
                <div className="text-2xl font-bold">{totalSkills}</div>
              </div>
              <div className="mt-4 flex items-center text-sm text-muted-foreground">
                <TrendingUp className="mr-1 h-4 w-4 text-green-500" />
                <span className="text-green-500 font-medium">+24</span>
                <span className="ml-1">in dieser Woche</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Analysierte Dokumente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <div className="mr-4 rounded-full bg-amber-500/10 p-2">
                  <FileText className="h-6 w-6 text-amber-500" />
                </div>
                <div className="text-2xl font-bold">{documentsAnalyzed}</div>
              </div>
              <div className="mt-4 flex items-center text-sm text-muted-foreground">
                <Clock className="mr-1 h-4 w-4" />
                <span>Zuletzt vor 2 Stunden</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Datenbank-Vollständigkeit</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <div className="mr-4 rounded-full bg-green-500/10 p-2">
                  <Briefcase className="h-6 w-6 text-green-500" />
                </div>
                <div className="text-2xl font-bold">{progress}%</div>
              </div>
              <div className="mt-2">
                <Progress value={progress} className="h-2" />
              </div>
              <div className="mt-2 text-sm text-muted-foreground">
                <span>Nächstes Update: 24.03.2025</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Charts Section */}
      <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Fähigkeiten-Verteilung</CardTitle>
            <CardDescription>Verteilung der Top-Fähigkeiten im Unternehmen</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <SkillDistributionChart />
            </div>
          </CardContent>
          <CardFooter className="border-t px-6 py-3">
            <Button variant="ghost" className="ml-auto" size="sm">
              Alle Fähigkeiten anzeigen
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Abteilungs-Übersicht</CardTitle>
            <CardDescription>Mitarbeiter und Fähigkeiten nach Abteilung</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <DepartmentChart />
            </div>
          </CardContent>
          <CardFooter className="border-t px-6 py-3">
            <Button variant="ghost" className="ml-auto" size="sm">
              Abteilungsdetails
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      </motion.div>

      {/* Recent Activity */}
      <motion.div variants={item}>
        <Card>
          <CardHeader>
            <CardTitle>Neueste Aktivitäten</CardTitle>
            <CardDescription>Letzte Änderungen und Aktualisierungen</CardDescription>
          </CardHeader>
          <CardContent>
            <RecentActivityList />
          </CardContent>
          <CardFooter className="border-t px-6 py-3">
            <Button variant="ghost" className="ml-auto" size="sm">
              Alle Aktivitäten anzeigen
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    </motion.div>
  );
}
