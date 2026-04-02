package search

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"
)

// Service handles web search for feature discovery.
type Service struct {
	braveAPIKey string
	client      *http.Client
}

// New creates a new search service.
func New(braveAPIKey string) *Service {
	return &Service{
		braveAPIKey: braveAPIKey,
		client:      &http.Client{Timeout: 15 * time.Second},
	}
}

// SearchResult holds a single search result.
type SearchResult struct {
	Title       string `json:"title"`
	Description string `json:"description"`
	URL         string `json:"url"`
}

// SearchFeatures searches for common features of a given project type.
func (s *Service) SearchFeatures(projectType string) ([]SearchResult, error) {
	query := fmt.Sprintf("most common features %s web app MVP functionality list 2024", projectType)

	reqURL := fmt.Sprintf("https://api.search.brave.com/res/v1/web/search?q=%s&count=5", url.QueryEscape(query))

	req, _ := http.NewRequest(http.MethodGet, reqURL, nil)
	req.Header.Set("Accept", "application/json")
	req.Header.Set("Accept-Encoding", "gzip")
	req.Header.Set("X-Subscription-Token", s.braveAPIKey)

	resp, err := s.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("brave search: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("brave search error (%d): %s", resp.StatusCode, string(body))
	}

	var result struct {
		Web struct {
			Results []struct {
				Title       string `json:"title"`
				Description string `json:"description"`
				URL         string `json:"url"`
			} `json:"results"`
		} `json:"web"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("decoding search results: %w", err)
	}

	var results []SearchResult
	for _, r := range result.Web.Results {
		results = append(results, SearchResult{
			Title:       r.Title,
			Description: r.Description,
			URL:         r.URL,
		})
	}

	return results, nil
}

// SummarizeSearchResults formats search results as context for the AI.
func SummarizeSearchResults(results []SearchResult) string {
	var sb strings.Builder
	sb.WriteString("Web search results for feature discovery:\n\n")
	for i, r := range results {
		sb.WriteString(fmt.Sprintf("%d. %s\n   %s\n   Source: %s\n\n", i+1, r.Title, r.Description, r.URL))
	}
	return sb.String()
}

// DetectProjectType extracts the project type from a user prompt.
func DetectProjectType(prompt string) string {
	lower := strings.ToLower(prompt)

	keywords := map[string]string{
		"contact":     "contact management CRM",
		"crm":         "CRM customer relationship management",
		"invoice":     "invoice billing management",
		"ecommerce":   "e-commerce online store",
		"e-commerce":  "e-commerce online store",
		"shop":        "e-commerce online store",
		"store":       "e-commerce online store",
		"blog":        "blog CMS content management",
		"todo":        "task management productivity",
		"task":        "task management productivity",
		"project":     "project management",
		"booking":     "booking reservation management",
		"appointment": "booking appointment scheduling",
		"inventory":   "inventory management",
		"hr":          "human resources HR management",
		"employee":    "human resources employee management",
		"restaurant":  "restaurant management POS",
		"school":      "school management education LMS",
		"hospital":    "hospital clinic management",
		"clinic":      "hospital clinic management",
		"real estate": "real estate property management",
		"property":    "real estate property management",
		"marketplace": "online marketplace platform",
		"social":      "social network community platform",
		"saas":        "SaaS dashboard analytics",
		"dashboard":   "admin dashboard analytics",
		"portfolio":   "portfolio personal website",
		"agency":      "agency services website",
		"landing":     "landing page marketing",
		"newsletter":  "newsletter email marketing",
		"forum":       "forum community discussion",
		"chat":        "chat messaging application",
	}

	for keyword, projectType := range keywords {
		if strings.Contains(lower, keyword) {
			return projectType
		}
	}

	return ""
}
