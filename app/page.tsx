"use client";

import { useState } from "react";
import { RepoSearch } from "@/components/github/RepoSearch";
import { Timeline } from "@/components/github/Timeline";
import { ActivityChart } from "@/components/github/ActivityChart";
import { Repository, TimelineData, fetchRepositoryTimeline } from "@/lib/github/api";
import { ThemeSwitcher } from "@/components/theme/theme-switcher";
import Image from "next/image";

export default function Home() {
  const [timelineData, setTimelineData] = useState<TimelineData | undefined>();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [currentRepo, setCurrentRepo] = useState<Repository | null>(null);

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
    <div className="flex flex-col min-h-screen p-8 gap-8">
      <header className="flex flex-col items-center relative">
        <div className="absolute right-0 top-0">
          <ThemeSwitcher />
        </div>
        <h1 className="text-3xl font-bold mb-4">GitHub Repository Timeline</h1>
        <p className="text-center max-w-lg text-muted-foreground mb-8">
          Visualize the history of any GitHub repository with commits, pull requests, and issues all in one place.
        </p>
        <RepoSearch onRepoSelect={handleRepoSelect} />
        {error && <p className="text-red-500 mt-4">{error}</p>}
      </header>
      
      <main className="flex-1 w-full max-w-4xl mx-auto">
        <ActivityChart timelineData={timelineData} isLoading={isLoading} />
        <Timeline 
          timelineData={timelineData} 
          isLoading={isLoading} 
          onLoadMore={handleLoadMore}
          isLoadingMore={isLoadingMore}
        />
      </main>
      
      <footer className="mt-auto text-center text-sm text-muted-foreground py-4">
        <p>
          Built with Next.js, shadcn/ui and the GitHub API
        </p>
      </footer>
    </div>
  );
}
