package credits

import (
	"testing"
)

func TestCreditCacheKey(t *testing.T) {
	key := creditCacheKey(42)
	expected := "credits:balance:42"
	if key != expected {
		t.Errorf("expected %q, got %q", expected, key)
	}
}

func TestCheckResult(t *testing.T) {
	result := CheckResult{
		HasEnough: true,
		Balance:   50,
		Required:  10,
	}

	if !result.HasEnough {
		t.Error("expected HasEnough to be true")
	}
	if result.Balance != 50 {
		t.Errorf("expected balance 50, got %d", result.Balance)
	}
	if result.Required != 10 {
		t.Errorf("expected required 10, got %d", result.Required)
	}
}

func TestCheckResult_Insufficient(t *testing.T) {
	result := CheckResult{
		HasEnough: false,
		Balance:   3,
		Required:  5,
	}

	if result.HasEnough {
		t.Error("expected HasEnough to be false when balance < required")
	}
}

func TestNewService(t *testing.T) {
	// Test that New returns a non-nil service even with nil cache
	svc := New(nil, nil)
	if svc == nil {
		t.Fatal("expected non-nil service")
	}
	if svc.cache != nil {
		t.Error("expected cache to be nil when not provided")
	}
}

func TestInvalidateBalanceCache_NilCache(t *testing.T) {
	// Should not panic when cache is nil
	svc := New(nil, nil)
	svc.invalidateBalanceCache(1) // should be a no-op
}
