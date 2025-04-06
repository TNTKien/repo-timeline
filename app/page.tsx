"use client";

import { useState } from "react";
import { RepoSearch } from "@/components/github/RepoSearch";
import { Timeline } from "@/components/github/Timeline";
import { ActivityChart } from "@/components/github/ActivityChart";
import { RepoHeader } from "@/components/github/RepoHeader";
import { ScrollToTopButton } from "@/components/ui/scroll-to-top-button";
import { Repository, TimelineData, fetchRepositoryTimeline } from "@/lib/github/api";
import { ThemeSwitcher } from "@/components/theme/theme-switcher";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GitBranchIcon, BarChartIcon, ClockIcon, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  const [timelineData, setTimelineData] = useState<TimelineData | undefined>();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [currentRepo, setCurrentRepo] = useState<Repository | null>(null);
  const [activeTab, setActiveTab] = useState<string>("timeline");

  const handleRepoSelect = async (repo: Repository) => {
    setIsLoading(true);
    setError("");
    setCurrentRepo(repo);
    
    try {
      const data = await fetchRepositoryTimeline(repo, { page: 1 });
      setTimelineData(data);
    } catch (err) {
      console.error("Error fetching timeline:", err);
      setError("Failed to fetch repository timeline. Please check the repository name and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadMore = async (page: number, filter: string) => {
    if (!currentRepo) return;
    
    setIsLoadingMore(true);
    
    try {
      const newData = await fetchRepositoryTimeline(currentRepo, { 
        page,
        filter: filter as 'all' | 'commit' | 'pull_request' | 'issue'
      });
      
      if (page === 1) {
        // If it's a reset (new filter), just set the new data
        setTimelineData(newData);
      } else {
        // Otherwise, append the new items to the existing ones
        setTimelineData(prevData => {
          if (!prevData) return newData;
          
          // Combine and deduplicate items
          const combinedItems = [...prevData.items, ...newData.items];
          const uniqueItems = Array.from(
            new Map(combinedItems.map(item => [item.id, item])).values()
          ).sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          
          return {
            ...newData,
            items: uniqueItems,
          };
        });
      }
    } catch (err) {
      console.error("Error fetching more timeline items:", err);
      setError("Failed to load more timeline items.");
    } finally {
      setIsLoadingMore(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-background/95">
      {/* ScrollToTopButton */}
      <ScrollToTopButton />
      
      <div className="flex-1 container max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header with Theme Switcher */}
        <header className="flex flex-col items-center relative pb-4 border-b border-border/40">
          <div className="absolute right-0 top-0">
            <ThemeSwitcher />
          </div>
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center space-y-4 mb-8"
          >
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-transparent bg-clip-text">
              GitHub Repository Timeline
            </h1>
            <p className="text-center max-w-lg mx-auto text-muted-foreground text-lg">
              Visualize the history of any GitHub repository with commits, pull requests, and issues in one place.
            </p>
          </motion.div>
          <RepoSearch onRepoSelect={handleRepoSelect} />
          {error && (
            <div className="mt-4 p-3 bg-red-100 border border-red-200 rounded-md text-red-800 dark:bg-red-900/30 dark:border-red-800 dark:text-red-400 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <p>{error}</p>
            </div>
          )}
        </header>
        
        {/* Main Content */}
        <main className="flex-1 w-full space-y-6">
          {/* Repository Header */}
          {(timelineData || isLoading) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <RepoHeader 
                repository={timelineData?.repository || (currentRepo as Repository)} 
                isLoading={isLoading && !timelineData} 
              />
            </motion.div>
          )}
          
          {/* Content Tabs */}
          {timelineData && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="flex justify-center mb-4">
                  <TabsList className="grid grid-cols-2 w-full max-w-md">
                    <TabsTrigger value="timeline" className="flex items-center gap-2">
                      <ClockIcon className="h-4 w-4" />
                      <span>Timeline</span>
                    </TabsTrigger>
                    <TabsTrigger value="activity" className="flex items-center gap-2">
                      <BarChartIcon className="h-4 w-4" />
                      <span>Activity Chart</span>
                    </TabsTrigger>
                  </TabsList>
                </div>
                
                <TabsContent value="timeline" className="space-y-6">
                  <Timeline 
                    timelineData={timelineData} 
                    isLoading={isLoading} 
                    onLoadMore={handleLoadMore}
                    isLoadingMore={isLoadingMore}
                  />
                </TabsContent>
                
                <TabsContent value="activity" className="space-y-6">
                  <Card>
                    <CardContent className="pt-6">
                      <ActivityChart timelineData={timelineData} isLoading={isLoading} />
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </motion.div>
          )}
          
          {/* Empty State */}
          {!timelineData && !isLoading && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="my-16"
            >
              <div className="text-center space-y-4 py-12 px-4 rounded-xl bg-muted/50 border border-border/30">
                <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <GitBranchIcon className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-xl font-semibold">No Repository Selected</h2>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Enter a GitHub repository name or URL in the search box above to visualize its activity timeline.
                </p>
              </div>
            </motion.div>
          )}
        </main>
      </div>
      
      <footer className="border-t border-border/40 py-6 mt-8">
        <div className="container max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              Built with Next.js, shadcn/ui and the GitHub API
            </p>
            <div className="flex items-center gap-2">
              <a 
                href="https://github.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                GitHub
              </a>
              <span className="text-muted-foreground/40">•</span>
              <a 
                href="https://nextjs.org" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Next.js
              </a>
              <span className="text-muted-foreground/40">•</span>
              <a 
                href="https://ui.shadcn.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                shadcn/ui
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
