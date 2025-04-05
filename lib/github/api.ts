export type Repository = {
  owner: string;
  repo: string;
};

export type TimelineItem = {
  id: string;
  type: "commit" | "pull_request" | "issue";
  title: string;
  url: string;
  createdAt: string;
  author: {
    login: string;
    avatarUrl: string;
  };
  state?: string;
  number?: number;
};

export type PaginationData = {
  page: number;
  perPage: number;
  hasNextPage: boolean;
};

export type TimelineData = {
  repository: Repository;
  items: TimelineItem[];
  pagination: PaginationData;
};

/**
 * Parse a GitHub repository URL or owner/repo string
 * @param repoString - Repository string (e.g., "owner/repo" or "https://github.com/owner/repo")
 */
export function parseRepoString(repoString: string): Repository | null {
  // Handle "owner/repo" format
  if (repoString.split("/").length === 2) {
    const [owner, repo] = repoString.split("/");
    return { owner, repo };
  }
  
  // Handle GitHub URL format
  try {
    const url = new URL(repoString);
    if (url.hostname === "github.com") {
      const parts = url.pathname.split("/").filter(Boolean);
      if (parts.length >= 2) {
        return { owner: parts[0], repo: parts[1] };
      }
    }
  } catch (e) {
    // Not a valid URL
  }
  
  return null;
}

/**
 * Fetch repository timeline data (commits, PRs, issues) using our server API
 */
export async function fetchRepositoryTimeline(
  repository: Repository,
  options: { 
    page?: number; 
    perPage?: number;
    filter?: 'all' | 'commit' | 'pull_request' | 'issue';
  } = {}
): Promise<TimelineData> {
  const { owner, repo } = repository;
  const page = options.page || 1;
  const perPage = options.perPage || 30;
  const filter = options.filter || 'all';
  
  const queryParams = new URLSearchParams({
    owner: owner,
    repo: repo,
    page: page.toString(),
    perPage: perPage.toString(),
    filter: filter,
  });
  
  const response = await fetch(`/api/github/timeline?${queryParams}`);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.details || 'Failed to fetch repository timeline');
  }
  
  return await response.json();
}