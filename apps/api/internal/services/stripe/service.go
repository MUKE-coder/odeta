package stripe

import (
	"fmt"

	"github.com/stripe/stripe-go/v76"
	"github.com/stripe/stripe-go/v76/billingportal/session"
	checkoutsession "github.com/stripe/stripe-go/v76/checkout/session"
	"github.com/stripe/stripe-go/v76/customer"
)

// PricingTier defines a subscription tier.
type PricingTier struct {
	Plan           string
	MonthlyPrice   int64  // in cents
	CreditsPerMonth int
	StripePriceID  string
	ExtraCreditCost float64 // per credit in dollars
}

// Tiers defines the available pricing plans.
var Tiers = map[string]PricingTier{
	"free": {
		Plan:           "free",
		MonthlyPrice:   0,
		CreditsPerMonth: 100,
	},
	"starter": {
		Plan:            "starter",
		MonthlyPrice:    1200, // $12
		CreditsPerMonth: 500,
		ExtraCreditCost: 0.05,
	},
	"pro": {
		Plan:            "pro",
		MonthlyPrice:    2900, // $29
		CreditsPerMonth: 2000,
		ExtraCreditCost: 0.03,
	},
}

// Service handles Stripe billing operations.
type Service struct {
	secretKey   string
	frontendURL string
}

// New creates a new Stripe billing service.
func New(secretKey, frontendURL string) *Service {
	stripe.Key = secretKey
	return &Service{
		secretKey:   secretKey,
		frontendURL: frontendURL,
	}
}

// CreateCustomer creates a Stripe customer for a new user.
func (s *Service) CreateCustomer(email, name string) (string, error) {
	params := &stripe.CustomerParams{
		Email: stripe.String(email),
		Name:  stripe.String(name),
	}

	c, err := customer.New(params)
	if err != nil {
		return "", fmt.Errorf("creating stripe customer: %w", err)
	}

	return c.ID, nil
}

// CreateCheckoutSession creates a Stripe Checkout session for subscription or credit purchase.
func (s *Service) CreateCheckoutSession(customerID, priceID string, mode string) (string, error) {
	checkoutMode := stripe.CheckoutSessionModeSubscription
	if mode == "payment" {
		checkoutMode = stripe.CheckoutSessionModePayment
	}

	params := &stripe.CheckoutSessionParams{
		Customer: stripe.String(customerID),
		Mode:     stripe.String(string(checkoutMode)),
		LineItems: []*stripe.CheckoutSessionLineItemParams{
			{
				Price:    stripe.String(priceID),
				Quantity: stripe.Int64(1),
			},
		},
		SuccessURL: stripe.String(s.frontendURL + "/dashboard/billing?success=true"),
		CancelURL:  stripe.String(s.frontendURL + "/dashboard/billing?canceled=true"),
	}

	sess, err := checkoutsession.New(params)
	if err != nil {
		return "", fmt.Errorf("creating checkout session: %w", err)
	}

	return sess.URL, nil
}

// CreatePortalSession creates a Stripe Billing Portal session.
func (s *Service) CreatePortalSession(customerID string) (string, error) {
	params := &stripe.BillingPortalSessionParams{
		Customer:  stripe.String(customerID),
		ReturnURL: stripe.String(s.frontendURL + "/dashboard/billing"),
	}

	sess, err := session.New(params)
	if err != nil {
		return "", fmt.Errorf("creating portal session: %w", err)
	}

	return sess.URL, nil
}

// SetTierPriceIDs sets the Stripe price IDs for each tier.
// Call this after creating products/prices in the Stripe dashboard.
func SetTierPriceIDs(starterPriceID, proPriceID string) {
	if t, ok := Tiers["starter"]; ok {
		t.StripePriceID = starterPriceID
		Tiers["starter"] = t
	}
	if t, ok := Tiers["pro"]; ok {
		t.StripePriceID = proPriceID
		Tiers["pro"] = t
	}
}
