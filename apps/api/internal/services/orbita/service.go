package orbita

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

// Service handles Orbita deployment operations.
type Service struct {
	apiKey  string
	baseURL string
	client  *http.Client
}

// New creates a new Orbita deployment service.
func New(apiKey string) *Service {
	return &Service{
		apiKey:  apiKey,
		baseURL: "https://api.orbita.dev/v1", // placeholder — update when Orbita API is available
		client:  &http.Client{Timeout: 60 * time.Second},
	}
}

// App represents an Orbita application.
type App struct {
	ID        string `json:"id"`
	Name      string `json:"name"`
	Subdomain string `json:"subdomain"`
	Status    string `json:"status"`
	URL       string `json:"url"`
}

// CreateApp creates a new application on Orbita.
func (s *Service) CreateApp(name, subdomain, repoURL string) (*App, error) {
	body := map[string]string{
		"name":      name,
		"subdomain": subdomain,
		"repo_url":  repoURL,
	}

	data, _ := json.Marshal(body)
	req, _ := http.NewRequest(http.MethodPost, s.baseURL+"/apps", bytes.NewReader(data))
	req.Header.Set("Authorization", "Bearer "+s.apiKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := s.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("creating app: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		respBody, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("orbita error (%d): %s", resp.StatusCode, string(respBody))
	}

	var app App
	if err := json.NewDecoder(resp.Body).Decode(&app); err != nil {
		return nil, fmt.Errorf("decoding response: %w", err)
	}

	return &app, nil
}

// Deploy triggers a deployment for an existing application.
func (s *Service) Deploy(appID string) error {
	req, _ := http.NewRequest(http.MethodPost, s.baseURL+"/apps/"+appID+"/deploy", nil)
	req.Header.Set("Authorization", "Bearer "+s.apiKey)

	resp, err := s.client.Do(req)
	if err != nil {
		return fmt.Errorf("deploying app: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		respBody, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("orbita deploy error (%d): %s", resp.StatusCode, string(respBody))
	}

	return nil
}

// GetStatus returns the current deployment status of an app.
func (s *Service) GetStatus(appID string) (string, error) {
	req, _ := http.NewRequest(http.MethodGet, s.baseURL+"/apps/"+appID, nil)
	req.Header.Set("Authorization", "Bearer "+s.apiKey)

	resp, err := s.client.Do(req)
	if err != nil {
		return "", fmt.Errorf("getting status: %w", err)
	}
	defer resp.Body.Close()

	var app App
	if err := json.NewDecoder(resp.Body).Decode(&app); err != nil {
		return "", fmt.Errorf("decoding response: %w", err)
	}

	return app.Status, nil
}

// GetLogs returns deployment logs for an app.
func (s *Service) GetLogs(appID string) (string, error) {
	req, _ := http.NewRequest(http.MethodGet, s.baseURL+"/apps/"+appID+"/logs", nil)
	req.Header.Set("Authorization", "Bearer "+s.apiKey)

	resp, err := s.client.Do(req)
	if err != nil {
		return "", fmt.Errorf("getting logs: %w", err)
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	return string(body), nil
}

// DeleteApp removes an application from Orbita.
func (s *Service) DeleteApp(appID string) error {
	req, _ := http.NewRequest(http.MethodDelete, s.baseURL+"/apps/"+appID, nil)
	req.Header.Set("Authorization", "Bearer "+s.apiKey)

	resp, err := s.client.Do(req)
	if err != nil {
		return fmt.Errorf("deleting app: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		respBody, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("orbita delete error (%d): %s", resp.StatusCode, string(respBody))
	}

	return nil
}
