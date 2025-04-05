"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { parseRepoString, Repository } from "@/lib/github/api";

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
    <div className="space-y-4 w-full max-w-md mx-auto">
      <h2 className="text-xl font-bold text-center">Search GitHub Repository</h2>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          placeholder="owner/repo or GitHub URL"
          value={repoInput}
          onChange={(e) => setRepoInput(e.target.value)}
          className="flex-1"
        />
        <Button type="submit">Search</Button>
      </form>
      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  );
}