/**
 * Fetches the star count for a GitHub repository
 * @param owner - Repository owner username
 * @param repo - Repository name
 */
export async function fetchGitHubStars(owner: string, repo: string): Promise<number | null> {
  try {
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`);

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const data = await response.json();
    return data.stargazers_count || 0;
  } catch (error) {
    console.error('Failed to fetch GitHub stars:', error);
    return null;
  }
}

/**
 * Updates the GitHub stars display in the UI
 * @param owner - Repository owner username
 * @param repo - Repository name
 */
export async function updateGitHubStarsDisplay(owner: string, repo: string): Promise<void> {
  const starsElement = document.getElementById('github-stars');
  if (!starsElement) return;

  const stars = await fetchGitHubStars(owner, repo);

  if (stars !== null) {
    starsElement.textContent = `⭐ ${stars}`;
  } else {
    starsElement.textContent = '⭐';
  }
}
