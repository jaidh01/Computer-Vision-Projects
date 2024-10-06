const github = require('@actions/github');
const core = require('@actions/core');
const { context } = github;

(async () => {
  try {
    const token = process.env.GITHUB_TOKEN;
    const octokit = github.getOctokit(token);
    const pr = context.payload.pull_request;
    const prNumber = pr.number;
    const prBody = pr.body;
    const repoOwner = context.repo.owner;
    const repoName = context.repo.repo;

    const issueRegex = /#(\d+)/;
    const match = prBody.match(issueRegex);
    
    if (match) {
      const issueNumber = match[1];
      
      // Fetch issue labels
      const issue = await octokit.rest.issues.get({
        owner: repoOwner,
        repo: repoName,
        issue_number: issueNumber
      });
      
      const issueLabels = issue.data.labels.map(label => label.name);
      
      // Apply labels to the PR
      await octokit.rest.issues.addLabels({
        owner: repoOwner,
        repo: repoName,
        issue_number: prNumber,
        labels: issueLabels
      });
      
      console.log(`Labels [${issueLabels.join(", ")}] applied to PR #${prNumber}`);
    } else {
      // Comment on the PR asking to add an issue number
      await octokit.rest.issues.createComment({
        owner: repoOwner,
        repo: repoName,
        issue_number: prNumber,
        body: 'Please add a valid issue number in the format `#<issue_number>` to the PR description.'
      });
      
      console.log(`Comment added to PR #${prNumber} requesting an issue number.`);
    }
  } catch (error) {
    core.setFailed(`Action failed with error: ${error.message}`);
  }
})();