"use client";

import { Repository } from "@/lib/github/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {  BookIcon, CodeIcon } from "lucide-react";


interface RepoHeaderProps {
  repository: Repository;
  isLoading: boolean;
}

export function RepoHeader({ repository, isLoading }: RepoHeaderProps) {
  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div>
              <Skeleton className="h-6 w-40 mb-2" />
              <Skeleton className="h-4 w-60" />
            </div>
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-5 w-20" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const { owner, repo } = repository;
  const repoUrl = `https://github.com/${owner}/${repo}`;

  return (
    <Card className="w-full overflow-hidden bg-gradient-to-b from-card/80 to-card">
      <CardHeader className="pb-3">
        <div className="flex flex-col md:flex-row justify-between items-start gap-4">
          <div>
            <div className="flex items-center gap-2">
              <BookIcon className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-xl">
                <a 
                  href={repoUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:underline flex items-center gap-1"
                >
                  <span className="text-muted-foreground">{owner}</span>
                  <span className="text-foreground">/</span>
                  <span>{repo}</span>
                </a>
              </CardTitle>
            </div>
            <CardDescription className="mt-1">
              Visualizing activity timeline for this repository
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <a 
              href={repoUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs bg-secondary rounded-md px-3 py-1 hover:bg-secondary/80 transition-colors"
            >
              <CodeIcon className="h-3.5 w-3.5" />
              <span>View on GitHub</span>
            </a>
          </div>
        </div>
      </CardHeader>
      <div className="h-1 w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
    </Card>
  );
}