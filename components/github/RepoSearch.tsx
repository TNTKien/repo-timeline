"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { parseRepoString, Repository } from "@/lib/github/api";
import { SearchIcon } from "lucide-react";
import { motion } from "framer-motion";

interface RepoSearchProps {
  onRepoSelect: (repo: Repository) => void;
}

export function RepoSearch({ onRepoSelect }: RepoSearchProps) {
  const [repoInput, setRepoInput] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const repo = parseRepoString(repoInput);
    if (!repo) {
      setError("Please enter a valid GitHub repository URL or owner/repo format");
      return;
    }

    onRepoSelect(repo);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="w-full max-w-md mx-auto"
    >
      <div className="space-y-4">
        <form onSubmit={handleSubmit} className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            <SearchIcon className="h-4 w-4" />
          </div>
          <Input
            placeholder="owner/repo or GitHub URL (e.g., facebook/react)"
            value={repoInput}
            onChange={(e) => setRepoInput(e.target.value)}
            className="pl-9 pr-24 py-6 rounded-xl border-border/50 focus-visible:ring-blue-500"
          />
          <Button 
            type="submit" 
            className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg py-1.5 h-9"
          >
            Search
          </Button>
        </form>
        {error && (
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-red-500 text-sm flex items-center gap-1.5 justify-center"
          >
            <span>⚠️</span> {error}
          </motion.p>
        )}
        <div className="text-xs text-center text-muted-foreground">
          Try: <button 
            type="button"
            onClick={() => setRepoInput("facebook/react")}
            className="text-primary hover:underline"
          >
            facebook/react
          </button> or <button 
            type="button"
            onClick={() => setRepoInput("vercel/next.js")}
            className="text-primary hover:underline"
          >
            vercel/next.js
          </button>
        </div>
      </div>
    </motion.div>
  );
}