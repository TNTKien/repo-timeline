import { NextRequest, NextResponse } from 'next/server';
import { Octokit } from '@octokit/rest';

// Initialize Octokit with the server-side token
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const owner = searchParams.get('owner');
  const repo = searchParams.get('repo');
  const limit = Number(searchParams.get('limit') || 50);

  if (!owner || !repo) {
    return NextResponse.json({ error: 'Missing owner or repo parameters' }, { status: 400 });
  }

  try {
    // Fetch commits
    const [commitsResponse, pullsResponse, issuesResponse] = await Promise.all([
      octokit.repos.listCommits({
        owner,
        repo,
        per_page: limit,
      }),
      octokit.pulls.list({
        owner,
        repo,
        state: 'all',
        per_page: limit,
      }),
      octokit.issues.listForRepo({
        owner,
        repo,
        state: 'all',
        per_page: limit,
      }),
    ]);

    const commits = commitsResponse.data;
    const pullRequests = pullsResponse.data;
    const issues = issuesResponse.data;

    // Filter out pull requests from issues (they are included in the issues endpoint)
    const filteredIssues = issues.filter(issue => !issue.pull_request);

    // Convert to unified timeline items
    const timelineItems = [
      ...commits.map(commit => ({
        id: commit.sha,
        type: "commit",
        title: commit.commit.message.split("\n")[0],
        url: commit.html_url,
        createdAt: commit.commit.author?.date || commit.commit.committer?.date || "",
        author: {
          login: commit.author?.login || commit.commit.author?.name || "unknown",
          avatarUrl: commit.author?.avatar_url || "",
        },
      })),
      
      ...pullRequests.map(pr => ({
        id: `pr-${pr.id}`,
        type: "pull_request",
        title: pr.title,
        url: pr.html_url,
        createdAt: pr.created_at,
        author: {
          login: pr.user?.login || "unknown",
          avatarUrl: pr.user?.avatar_url || "",
        },
        state: pr.state,
        number: pr.number,
      })),
      
      ...filteredIssues.map(issue => ({
        id: `issue-${issue.id}`,
        type: "issue",
        title: issue.title,
        url: issue.html_url,
        createdAt: issue.created_at,
        author: {
          login: issue.user?.login || "unknown",
          avatarUrl: issue.user?.avatar_url || "",
        },
        state: issue.state,
        number: issue.number,
      })),
    ];
    
    // Sort by created date descending
    timelineItems.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json({
      repository: { owner, repo },
      items: timelineItems.slice(0, limit),
    });
  } catch (error: any) {
    console.error('GitHub API error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch repository data',
      details: error.message 
    }, { status: 500 });
  }
}