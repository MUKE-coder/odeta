package dgateway

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

const baseURL = "https://dgatewayapi.desispay.com"

// PricingTier defines a subscription/credit package.
type PricingTier struct {
	Plan            string
	Credits         int
	AmountUGX       int
	AmountUSD       int
	Description     string
}

// Tiers defines the available pricing plans.
var Tiers = map[string]PricingTier{
	"free": {
		Plan:    "free",
		Credits: 100,
	},
	"starter": {
		Plan:        "starter",
		Credits:     500,
		AmountUGX:   45000,
		AmountUSD:   1200,
		Description: "Odeta Starter — 500 credits",
	},
	"pro": {
		Plan:        "pro",
		Credits:     2000,
		AmountUGX:   110000,
		AmountUSD:   2900,
		Description: "Odeta Pro — 2,000 credits",
	},
}

// Service handles DGateway payment operations.
type Service struct {
	apiKey     string
	callbackURL string
	client     *http.Client
}

// New creates a new DGateway service.
func New(apiKey, callbackURL string) *Service {
	return &Service{
		apiKey:      apiKey,
		callbackURL: callbackURL,
		client:      &http.Client{Timeout: 30 * time.Second},
	}
}

// CollectResponse is the response from a collection request.
type CollectResponse struct {
	Data struct {
		Reference   string `json:"reference"`
		Status      string `json:"status"`
		ProviderRef string `json:"provider_ref"`
	} `json:"data"`
	Message string `json:"message"`
}

// CollectPayment initiates a mobile money or card payment collection.
func (s *Service) CollectPayment(amount int, currency, phoneNumber, description string, metadata map[string]interface{}) (*CollectResponse, error) {
	body := map[string]interface{}{
		"amount":       amount,
		"currency":     currency,
		"phone_number": phoneNumber,
		"description":  description,
		"callback_url": s.callbackURL,
		"metadata":     metadata,
	}

	data, _ := json.Marshal(body)
	req, _ := http.NewRequest(http.MethodPost, baseURL+"/v1/payments/collect", bytes.NewReader(data))
	req.Header.Set("X-Api-Key", s.apiKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := s.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("dgateway collect: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		respBody, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("dgateway error (%d): %s", resp.StatusCode, string(respBody))
	}

	var result CollectResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("dgateway decode: %w", err)
	}

	return &result, nil
}

// TransactionResponse is the response from a transaction query.
type TransactionResponse struct {
	Data struct {
		Reference     string `json:"reference"`
		Status        string `json:"status"`
		Amount        int    `json:"amount"`
		Currency      string `json:"currency"`
		FailureReason string `json:"failure_reason"`
	} `json:"data"`
}

// GetTransaction retrieves a transaction by reference.
func (s *Service) GetTransaction(reference string) (*TransactionResponse, error) {
	req, _ := http.NewRequest(http.MethodGet, baseURL+"/v1/payments/transactions/"+reference, nil)
	req.Header.Set("X-Api-Key", s.apiKey)

	resp, err := s.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("dgateway get transaction: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		respBody, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("dgateway error (%d): %s", resp.StatusCode, string(respBody))
	}

	var result TransactionResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("dgateway decode: %w", err)
	}

	return &result, nil
}

// VerifyTransaction polls the provider for the latest transaction status.
func (s *Service) VerifyTransaction(reference string) (*TransactionResponse, error) {
	body := map[string]interface{}{
		"reference": reference,
	}

	data, _ := json.Marshal(body)
	req, _ := http.NewRequest(http.MethodPost, baseURL+"/v1/webhooks/verify", bytes.NewReader(data))
	req.Header.Set("X-Api-Key", s.apiKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := s.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("dgateway verify: %w", err)
	}
	defer resp.Body.Close()

	var result TransactionResponse
	json.NewDecoder(resp.Body).Decode(&result)
	return &result, nil
}
