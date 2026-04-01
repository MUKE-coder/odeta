package github

import (
	"context"
	"fmt"

	gh "github.com/google/go-github/v60/github"
	"golang.org/x/oauth2"
)

// Service handles GitHub API operations for repo automation.
type Service struct {
	appID      string
	privateKey string
}

// New creates a new GitHub service.
func New(appID, privateKey string) *Service {
	return &Service{
		appID:      appID,
		privateKey: privateKey,
	}
}

// clientForUser creates a GitHub client authenticated with the user's token.
func clientForUser(ctx context.Context, userToken string) *gh.Client {
	ts := oauth2.StaticTokenSource(&oauth2.Token{AccessToken: userToken})
	tc := oauth2.NewClient(ctx, ts)
	return gh.NewClient(tc)
}

// CreateRepo creates a new GitHub repository under the user's account.
func (s *Service) CreateRepo(ctx context.Context, userToken, name string, private bool) (string, error) {
	client := clientForUser(ctx, userToken)

	repo := &gh.Repository{
		Name:    gh.String(name),
		Private: gh.Bool(private),
		AutoInit: gh.Bool(true),
	}

	created, _, err := client.Repositories.Create(ctx, "", repo)
	if err != nil {
		return "", fmt.Errorf("creating repo: %w", err)
	}

	return created.GetHTMLURL(), nil
}

// PushFiles creates a commit with multiple files in a repository.
func (s *Service) PushFiles(ctx context.Context, userToken, owner, repo, message string, files map[string]string) error {
	client := clientForUser(ctx, userToken)

	// Get the reference for the main branch
	ref, _, err := client.Git.GetRef(ctx, owner, repo, "refs/heads/main")
	if err != nil {
		return fmt.Errorf("getting ref: %w", err)
	}

	// Get the commit that the ref points to
	parentCommit, _, err := client.Git.GetCommit(ctx, owner, repo, ref.GetObject().GetSHA())
	if err != nil {
		return fmt.Errorf("getting parent commit: %w", err)
	}

	// Create tree entries for all files
	var entries []*gh.TreeEntry
	for path, content := range files {
		entries = append(entries, &gh.TreeEntry{
			Path:    gh.String(path),
			Mode:    gh.String("100644"),
			Type:    gh.String("blob"),
			Content: gh.String(content),
		})
	}

	// Create the tree
	tree, _, err := client.Git.CreateTree(ctx, owner, repo, parentCommit.GetTree().GetSHA(), entries)
	if err != nil {
		return fmt.Errorf("creating tree: %w", err)
	}

	// Create the commit
	commit := &gh.Commit{
		Message: gh.String(message),
		Tree:    tree,
		Parents: []*gh.Commit{parentCommit},
	}
	newCommit, _, err := client.Git.CreateCommit(ctx, owner, repo, commit, nil)
	if err != nil {
		return fmt.Errorf("creating commit: %w", err)
	}

	// Update the reference
	ref.Object.SHA = newCommit.SHA
	_, _, err = client.Git.UpdateRef(ctx, owner, repo, ref, false)
	if err != nil {
		return fmt.Errorf("updating ref: %w", err)
	}

	return nil
}

// GetRepoURL returns the HTTPS URL for a repository.
func (s *Service) GetRepoURL(owner, repo string) string {
	return fmt.Sprintf("https://github.com/%s/%s", owner, repo)
}
