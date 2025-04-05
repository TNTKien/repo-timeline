"use client";

import { TimelineData, TimelineItem } from "@/lib/github/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface TimelineProps {
  timelineData?: TimelineData;
  isLoading: boolean;
  onLoadMore: (page: number, filter: string) => void;
  isLoadingMore: boolean;
}

export function Timeline({ timelineData, isLoading, onLoadMore, isLoadingMore }: TimelineProps) {
  const [filter, setFilter] = useState<string>("all");
  
  // Generate skeleton items for loading state
  if (isLoading && !timelineData) {
    return (
      <div className="space-y-4 w-full max-w-2xl mx-auto">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">Repository Timeline</h2>
          <Skeleton className="h-10 w-32" />
        </div>
        
        {Array(5)
          .fill(0)
          .map((_, i) => (
            <Card key={i} className="w-full">
              <CardHeader className="pb-2">
                <div className="flex justify-between">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-8 w-8 rounded-full" />
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
          ))}
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

  return (
    <div className="space-y-4 w-full max-w-2xl mx-auto">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">
          {repository.owner}/{repository.repo} Timeline
        </h2>
        <Select
          value={filter}
          onValueChange={handleFilterChange}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Events</SelectItem>
            <SelectItem value="commit">Commits</SelectItem>
            <SelectItem value="pull_request">Pull Requests</SelectItem>
            <SelectItem value="issue">Issues</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredItems.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">No items found with the selected filter</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {filteredItems.map((item) => (
            <TimelineItemCard key={item.id} item={item} />
          ))}
          
          {pagination.hasNextPage && (
            <div className="flex justify-center mt-6">
              <Button 
                onClick={handleLoadMore} 
                disabled={isLoadingMore}
                variant="outline"
                size="lg"
                className="w-full max-w-xs"
              >
                {isLoadingMore ? "Loading..." : "Load More"}
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

  // Get badge color based on type
  const getBadgeClass = (type: string, state?: string) => {
    if (type === "pull_request") {
      return state === "open" ? "bg-green-100 text-green-700" : "bg-purple-100 text-purple-700";
    } else if (type === "issue") {
      return state === "open" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700";
    }
    return "bg-blue-100 text-blue-700";
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

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between">
          <div className="flex items-center gap-2">
            <Avatar>
              <AvatarImage src={item.author.avatarUrl} alt={item.author.login} />
              <AvatarFallback>{item.author.login.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <span className="font-medium">{item.author.login}</span>
          </div>
          <time className="text-sm text-muted-foreground">
            {formatDate(item.createdAt)}
          </time>
        </div>
        <CardTitle className="text-lg mt-2">
          <a href={item.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
            {item.type === "commit" ? item.title : `#${item.number} ${item.title}`}
          </a>
        </CardTitle>
        <div className="mt-1">
          <span className={`inline-flex text-xs px-2 py-1 rounded-full ${getBadgeClass(item.type, item.state)}`}>
            {getTypeLabel(item.type, item.state)}
          </span>
        </div>
      </CardHeader>
    </Card>
  );
}