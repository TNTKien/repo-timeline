"use client";

import { TimelineData } from "@/lib/github/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3, Calendar, PieChart as PieChartIcon, Activity } from "lucide-react";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart, 
  Line
} from "recharts";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ActivityChartProps {
  timelineData?: TimelineData;
  isLoading: boolean;
}

export function ActivityChart({ timelineData, isLoading }: ActivityChartProps) {
  const [activeChart, setActiveChart] = useState<string>("activity");

  if (isLoading && !timelineData) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded-md" />
            <Skeleton className="h-6 w-32" />
          </h2>
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-32 mb-2" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-[300px] w-full">
              <Skeleton className="h-full w-full rounded-md" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!timelineData) {
    return null;
  }

  // Process data for activity analysis
  const processData = () => {
    const items = timelineData.items || [];
    
    // Activity by type for pie chart
    const activityByType = [
      { name: "Commits", value: items.filter(item => item.type === "commit").length },
      { name: "Pull Requests", value: items.filter(item => item.type === "pull_request").length },
      { name: "Issues", value: items.filter(item => item.type === "issue").length },
    ];
    
    // Monthly activity for line chart
    const monthlyMap = new Map();
    
    items.forEach(item => {
      const date = new Date(item.createdAt);
      const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyMap.has(monthYear)) {
        monthlyMap.set(monthYear, {
          month: new Date(date.getFullYear(), date.getMonth(), 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          commit: 0,
          pull_request: 0,
          issue: 0,
          total: 0
        });
      }
      
      const monthData = monthlyMap.get(monthYear);
      monthData[item.type] += 1;
      monthData.total += 1;
    });
    
    // Sort chronologically
    const monthlyActivity = Array.from(monthlyMap.values())
      .sort((a, b) => {
        const dateA = new Date(a.month);
        const dateB = new Date(b.month);
        return dateA.getTime() - dateB.getTime();
      });
    
    // Get most active contributors
    const authorMap = new Map();
    items.forEach(item => {
      const author = item.author.login;
      if (!authorMap.has(author)) {
        authorMap.set(author, { name: author, contributions: 0 });
      }
      authorMap.get(author).contributions += 1;
    });
    
    const contributors = Array.from(authorMap.values())
      .sort((a, b) => b.contributions - a.contributions)
      .slice(0, 5); // Top 5 contributors
    
    return {
      activityByType,
      monthlyActivity,
      contributors
    };
  };

  const { activityByType, monthlyActivity, contributors } = processData();
  
  // Colors for pie chart
  const COLORS = ['#0088FE', '#8884D8', '#FF8042'];
  
  // Customized tooltip for charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover shadow-md rounded-md border border-border p-3 text-sm">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={`item-${index}`} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          <span>Activity Analysis</span>
        </h2>
      </div>

      <Tabs value={activeChart} onValueChange={setActiveChart} className="w-full">
        <TabsList className="grid grid-cols-3 mb-6">
          <TabsTrigger value="activity" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            <span>Activity</span>
          </TabsTrigger>
          <TabsTrigger value="distribution" className="flex items-center gap-2">
            <PieChartIcon className="h-4 w-4" />
            <span>Distribution</span>
          </TabsTrigger>
          <TabsTrigger value="contributors" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>Contributors</span>
          </TabsTrigger>
        </TabsList>
        
        <motion.div
          key={activeChart}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <TabsContent value="activity" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Activity</CardTitle>
                <CardDescription>
                  Activity patterns over time, showing commits, PRs, and issues
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[350px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={monthlyActivity}
                      margin={{ top: 10, right: 30, left: 0, bottom: 30 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" height={60} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend verticalAlign="top" height={36} />
                      <Line type="monotone" dataKey="commit" name="Commits" stroke="#0088FE" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 6 }} />
                      <Line type="monotone" dataKey="pull_request" name="Pull Requests" stroke="#8884D8" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 6 }} />
                      <Line type="monotone" dataKey="issue" name="Issues" stroke="#FF8042" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="distribution" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Activity Distribution</CardTitle>
                <CardDescription>
                  Distribution of different activity types in the repository
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[350px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={activityByType}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {activityByType.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="contributors" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Top Contributors</CardTitle>
                <CardDescription>
                  Most active contributors in this repository
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[350px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={contributors}
                      margin={{ top: 10, right: 30, left: 20, bottom: 30 }}
                      layout="vertical"
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                      <XAxis type="number" tick={{ fontSize: 12 }} />
                      <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={80} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="contributions" name="Contributions" fill="#8884D8" radius={[0, 4, 4, 0]}>
                        {contributors.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </motion.div>
      </Tabs>

      <Card className="bg-muted/30">
        <CardContent className="pt-4 pb-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              <span>Timeline Period:</span>
            </div>
            <div>
              {monthlyActivity.length > 0 ? 
                <span>
                  {monthlyActivity[0].month} to {monthlyActivity[monthlyActivity.length - 1].month}
                </span> 
                : "No data available"}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}