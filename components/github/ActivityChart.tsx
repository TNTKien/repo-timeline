"use client";

import { useEffect, useMemo, useState } from "react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TimelineData, TimelineItem } from "@/lib/github/api";
import { format, parseISO, subMonths, compareAsc, getMonth, getYear } from "date-fns";

interface ActivityChartProps {
  timelineData?: TimelineData;
  isLoading: boolean;
}

export function ActivityChart({ timelineData, isLoading }: ActivityChartProps) {
  if (isLoading || !timelineData) {
    return (
      <Card className="w-full mx-auto mb-8">
        <CardHeader>
          <CardTitle className="text-xl">Repository Activity</CardTitle>
        </CardHeader>
        <CardContent className="h-80 flex items-center justify-center">
          <p className="text-muted-foreground">{isLoading ? "Loading chart data..." : "Search for a repository to view activity"}</p>
        </CardContent>
      </Card>
    );
  }

  const { items } = timelineData;

  // Prepare data for the chart - group by month
  const chartData = useMemo(() => {
    // Get the earliest date from items, or default to 6 months ago
    let earliestDate = subMonths(new Date(), 6);
    
    if (items.length > 0) {
      const dates = items.map(item => parseISO(item.createdAt));
      const sorted = [...dates].sort(compareAsc);
      // Use either the earliest date from data or 6 months ago, whichever is more recent
      earliestDate = compareAsc(sorted[0], earliestDate) === -1 ? earliestDate : sorted[0];
    }

    // Create a map of year-month to counts of each type
    const monthlyData = new Map();
    
    items.forEach(item => {
      const date = parseISO(item.createdAt);
      // Skip items older than our cutoff date
      if (compareAsc(date, earliestDate) === -1) return;
      
      const monthKey = format(date, 'yyyy-MM');
      
      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, {
          month: format(date, 'MMM yyyy'),
          commits: 0,
          pullRequests: 0,
          issues: 0,
          total: 0,
        });
      }
      
      const data = monthlyData.get(monthKey);
      
      if (item.type === 'commit') data.commits++;
      else if (item.type === 'pull_request') data.pullRequests++;
      else if (item.type === 'issue') data.issues++;
      
      data.total++;
    });
    
    // Convert to array and sort by date
    return Array.from(monthlyData.values()).sort((a, b) => {
      const [yearA, monthA] = a.month.split(' ');
      const [yearB, monthB] = b.month.split(' ');
      return yearA === yearB
        ? new Date(0, new Date(a.month + ' 1').getMonth()).getTime() - 
          new Date(0, new Date(b.month + ' 1').getMonth()).getTime()
        : parseInt(yearA) - parseInt(yearB);
    });
  }, [items]);

  return (
    <Card className="w-full mx-auto mb-8">
      <CardHeader>
        <CardTitle className="text-xl">Repository Activity</CardTitle>
      </CardHeader>
      <CardContent className="h-80">
        {chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-muted-foreground">No activity data available for the selected period</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="commits" name="Commits" fill="#3b82f6" />
              <Bar dataKey="pullRequests" name="Pull Requests" fill="#8b5cf6" />
              <Bar dataKey="issues" name="Issues" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}