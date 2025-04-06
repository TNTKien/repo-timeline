"use client";

import { TimelineData, TimelineItem } from "@/lib/github/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion } from "framer-motion";
import { ExternalLink, GitCommit, GitPullRequest, MessageCircle, Filter, CheckIcon, SlidersHorizontal } from "lucide-react";

interface TimelineProps {
  timelineData?: TimelineData;
  isLoading: boolean;
  onLoadMore: (page: number, filter: string) => void;
  isLoadingMore: boolean;
}

export function Timeline({ timelineData, isLoading, onLoadMore, isLoadingMore }: TimelineProps) {
  const [filter, setFilter] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<string>("newest");
  
  // Generate skeleton items for loading state
  if (isLoading && !timelineData) {
    return (
      <div className="space-y-4 w-full max-w-2xl mx-auto">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">Repository Timeline</h2>
          <Skeleton className="h-10 w-32" />
        </div>
        
        <div className="relative">
          <div className="absolute top-0 bottom-0 left-6 w-px bg-border/50 ml-[0.9rem]" />
          {Array(5)
            .fill(0)
            .map((_, i) => (
              <div key={i} className="flex gap-4 mb-6 relative">
                <Skeleton className="h-8 w-8 rounded-full shrink-0 mt-1" />
                <div className="w-full">
                  <Card className="w-full">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between">
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-6 w-6 rounded-full" />
                          <Skeleton className="h-4 w-20" />
                        </div>
                        <Skeleton className="h-4 w-12" />
                      </div>
                      <Skeleton className="h-5 w-3/4 mt-2" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-4/5 mt-2" />
                    </CardContent>
                  </Card>
                </div>
              </div>
            ))}
        </div>
      </div>
    );
  }

  if (!timelineData) {
    return (
      <div className="text-center py-10">
        <p>Search for a GitHub repository to view its timeline</p>
      </div>
    );
  }

  const { repository, items, pagination } = timelineData;

  // Filter items based on the selected filter
  const filteredItems = filter === "all" 
    ? items 
    : items.filter(item => item.type === filter);
    
  // Sort items based on sortOrder
  const sortedItems = [...filteredItems].sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
  });

  const handleFilterChange = (newFilter: string) => {
    setFilter(newFilter);
    // Reset pagination and reload with the new filter if it changes
    if (newFilter !== filter) {
      onLoadMore(1, newFilter);
    }
  };

  // Handle load more button click
  const handleLoadMore = () => {
    const nextPage = pagination.page + 1;
    onLoadMore(nextPage, filter);
  };

  // Generate filter statistics
  const stats = {
    all: items.length,
    commit: items.filter(item => item.type === "commit").length,
    pull_request: items.filter(item => item.type === "pull_request").length,
    issue: items.filter(item => item.type === "issue").length,
  };

  return (
    <div className="space-y-4 w-full max-w-2xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-bold">
          Activity Timeline
        </h2>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1 text-xs">
                <SlidersHorizontal className="h-3.5 w-3.5" />
                <span>Filters & Sort</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Event Type</DropdownMenuLabel>
              <DropdownMenuGroup>
                <DropdownMenuItem 
                  onClick={() => handleFilterChange("all")}
                  className="flex justify-between"
                >
                  All Events
                  <Badge variant="outline" className="ml-2">{stats.all}</Badge>
                  {filter === "all" && <CheckIcon className="h-4 w-4 ml-2" />}
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => handleFilterChange("commit")}
                  className="flex justify-between"
                >
                  <div className="flex items-center gap-1.5">
                    <GitCommit className="h-3.5 w-3.5" />
                    <span>Commits</span>
                  </div>
                  <div className="flex items-center">
                    <Badge variant="outline" className="ml-2">{stats.commit}</Badge>
                    {filter === "commit" && <CheckIcon className="h-4 w-4 ml-2" />}
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => handleFilterChange("pull_request")}
                  className="flex justify-between"
                >
                  <div className="flex items-center gap-1.5">
                    <GitPullRequest className="h-3.5 w-3.5" />
                    <span>Pull Requests</span>
                  </div>
                  <div className="flex items-center">
                    <Badge variant="outline" className="ml-2">{stats.pull_request}</Badge>
                    {filter === "pull_request" && <CheckIcon className="h-4 w-4 ml-2" />}
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => handleFilterChange("issue")}
                  className="flex justify-between"
                >
                  <div className="flex items-center gap-1.5">
                    <MessageCircle className="h-3.5 w-3.5" />
                    <span>Issues</span>
                  </div>
                  <div className="flex items-center">
                    <Badge variant="outline" className="ml-2">{stats.issue}</Badge>
                    {filter === "issue" && <CheckIcon className="h-4 w-4 ml-2" />}
                  </div>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Sort Order</DropdownMenuLabel>
              <DropdownMenuGroup>
                <DropdownMenuItem 
                  onClick={() => setSortOrder("newest")}
                  className="flex justify-between"
                >
                  Newest First
                  {sortOrder === "newest" && <CheckIcon className="h-4 w-4" />}
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setSortOrder("oldest")}
                  className="flex justify-between"
                >
                  Oldest First
                  {sortOrder === "oldest" && <CheckIcon className="h-4 w-4" />}
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">No items found with the selected filter</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="relative">
            {/* Timeline connector line */}
            <div className="absolute top-0 bottom-0 left-6 w-px bg-border ml-[0.9rem]" />
            {/* Timeline items */}
            <div className="space-y-6">
              {sortedItems.map((item, index) => (
                <motion.div 
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <TimelineItemCard item={item} />
                </motion.div>
              ))}
            </div>
          </div>
          
          {pagination.hasNextPage && (
            <div className="flex justify-center mt-8">
              <Button 
                onClick={handleLoadMore} 
                disabled={isLoadingMore}
                variant="outline"
                size="lg"
                className="w-full max-w-xs relative overflow-hidden group"
              >
                {isLoadingMore ? (
                  "Loading..."
                ) : (
                  <>
                    <span>Load More</span>
                    <span className="absolute bottom-0 left-0 w-full h-[2px] bg-primary/20 group-hover:bg-primary/40 transition-colors" />
                  </>
                )}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function TimelineItemCard({ item }: { item: TimelineItem }) {
  // Format the date to a more readable format
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Get icon based on type
  const getIcon = (type: string) => {
    switch (type) {
      case "commit":
        return <GitCommit className="h-5 w-5" />;
      case "pull_request":
        return <GitPullRequest className="h-5 w-5" />;
      case "issue":
        return <MessageCircle className="h-5 w-5" />;
      default:
        return null;
    }
  };

  // Get badge color based on type
  const getBadgeClass = (type: string, state?: string) => {
    if (type === "pull_request") {
      return state === "open" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400";
    } else if (type === "issue") {
      return state === "open" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400";
    }
    return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
  };

  // Get label based on type and state
  const getTypeLabel = (type: string, state?: string) => {
    if (type === "pull_request") {
      return `PR ${state === "open" ? "(Open)" : "(Merged)"}`;
    } else if (type === "issue") {
      return `Issue ${state === "open" ? "(Open)" : "(Closed)"}`;
    }
    return "Commit";
  };

  // Get timeline node based on type
  const getTimelineNode = (type: string, state?: string) => {
    let bgColor = "bg-blue-500";
    
    if (type === "pull_request") {
      bgColor = state === "open" ? "bg-green-500" : "bg-purple-500";
    } else if (type === "issue") {
      bgColor = state === "open" ? "bg-red-500" : "bg-gray-500";
    }
    
    return (
      <div className={`rounded-full h-8 w-8 flex items-center justify-center ${bgColor} text-white shrink-0 z-10`}>
        {getIcon(type)}
      </div>
    );
  };

  return (
    <div className="flex gap-4">
      {getTimelineNode(item.type, item.state)}
      <div className="w-full">
        <Card className="w-full transition-all hover:shadow-md">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={item.author.avatarUrl} alt={item.author.login} />
                  <AvatarFallback>{item.author.login.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="font-medium text-sm">{item.author.login}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`inline-flex text-xs px-2 py-1 rounded-full ${getBadgeClass(item.type, item.state)}`}>
                  {getTypeLabel(item.type, item.state)}
                </span>
                <time className="text-xs text-muted-foreground">
                  {formatDate(item.createdAt)}
                </time>
              </div>
            </div>
            <CardTitle className="text-base mt-2 line-clamp-2">
              <a href={item.url} target="_blank" rel="noopener noreferrer" className="hover:underline group">
                {item.type === "commit" ? item.title : `#${item.number} ${item.title}`}
                <ExternalLink className="inline-block ml-1 h-3 w-3 opacity-0 group-hover:opacity-70 transition-opacity" />
              </a>
            </CardTitle>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}