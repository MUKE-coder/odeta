package dgateway

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

// Service handles DGateway payment operations for African markets.
type Service struct {
	apiKey  string
	baseURL string
	client  *http.Client
}

// New creates a new DGateway service.
func New(apiKey string) *Service {
	return &Service{
		apiKey:  apiKey,
		baseURL: "https://api.dgateway.io/v1", // placeholder
		client:  &http.Client{Timeout: 30 * time.Second},
	}
}

// PaymentIntent represents a DGateway payment intent.
type PaymentIntent struct {
	ID         string `json:"id"`
	Amount     int    `json:"amount"`
	Currency   string `json:"currency"`
	Status     string `json:"status"`
	PaymentURL string `json:"payment_url"`
}

// CreatePaymentIntent creates a payment intent for credit purchase.
func (s *Service) CreatePaymentIntent(amount int, currency, description, callbackURL string) (*PaymentIntent, error) {
	body := map[string]interface{}{
		"amount":       amount,
		"currency":     currency,
		"description":  description,
		"callback_url": callbackURL,
	}

	data, _ := json.Marshal(body)
	req, _ := http.NewRequest(http.MethodPost, s.baseURL+"/payments", bytes.NewReader(data))
	req.Header.Set("Authorization", "Bearer "+s.apiKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := s.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("creating payment intent: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		respBody, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("dgateway error (%d): %s", resp.StatusCode, string(respBody))
	}

	var pi PaymentIntent
	if err := json.NewDecoder(resp.Body).Decode(&pi); err != nil {
		return nil, fmt.Errorf("decoding response: %w", err)
	}

	return &pi, nil
}
