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
  const page = Number(searchParams.get('page') || 1);
  const perPage = Number(searchParams.get('perPage') || 30);
  const filter = searchParams.get('filter') || 'all';

  if (!owner || !repo) {
    return NextResponse.json({ error: 'Missing owner or repo parameters' }, { status: 400 });
  }

  try {
    // Set up pagination parameters
    const apiOptions = {
      owner,
      repo,
      per_page: perPage,
      page,
    };

    // Determine which endpoints to fetch based on filter
    const fetchCommits = filter === 'all' || filter === 'commit';
    const fetchPulls = filter === 'all' || filter === 'pull_request';
    const fetchIssues = filter === 'all' || filter === 'issue';

    // Prepare API calls based on filter
    const apiCalls = [];
    if (fetchCommits) {
      apiCalls.push(octokit.repos.listCommits(apiOptions));
    }
    if (fetchPulls) {
      apiCalls.push(octokit.pulls.list({
        ...apiOptions,
        state: 'all',
      }));
    }
    if (fetchIssues) {
      apiCalls.push(octokit.issues.listForRepo({
        ...apiOptions,
        state: 'all',
      }));
    }

    // Execute API calls
    const responses = await Promise.all(apiCalls);
    
    // Extract response data based on which endpoints were called
    let commits: any[] = [];
    let pullRequests: any[] = [];
    let issues: any[] = [];
    
    let responseIndex = 0;
    if (fetchCommits) {
      commits = responses[responseIndex++].data;
    }
    if (fetchPulls) {
      pullRequests = responses[responseIndex++].data;
    }
    if (fetchIssues) {
      issues = responses[responseIndex++].data;
      // Filter out pull requests from issues (they are included in the issues endpoint)
      issues = issues.filter(issue => !issue.pull_request);
    }

    // Convert to unified timeline items
    const timelineItems = [
      ...(fetchCommits ? commits.map(commit => ({
        id: commit.sha,
        type: "commit",
        title: commit.commit.message.split("\n")[0],
        url: commit.html_url,
        createdAt: commit.commit.author?.date || commit.commit.committer?.date || "",
        author: {
          login: commit.author?.login || commit.commit.author?.name || "unknown",
          avatarUrl: commit.author?.avatar_url || "",
        },
      })) : []),
      
      ...(fetchPulls ? pullRequests.map(pr => ({
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
      })) : []),
      
      ...(fetchIssues ? issues.map(issue => ({
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
      })) : []),
    ];
    
    // Sort by created date descending
    timelineItems.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Get pagination metadata from one of the responses
    let hasNextPage = false;
    if (responses.length > 0) {
      // Check if any of the responses indicate more pages
      for (const response of responses) {
        const linkHeader = response.headers.link;
        if (linkHeader && linkHeader.includes('rel="next"')) {
          hasNextPage = true;
          break;
        }
      }
    }

    return NextResponse.json({
      repository: { owner, repo },
      items: timelineItems,
      pagination: {
        page,
        perPage,
        hasNextPage,
      }
    });
  } catch (error: any) {
    console.error('GitHub API error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch repository data',
      details: error.message 
    }, { status: 500 });
  }
}