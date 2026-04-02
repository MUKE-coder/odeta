package grit

import (
	"testing"
)

func TestResolve_JBCommand(t *testing.T) {
	r := NewCommandResolver()
	commands := r.Resolve([]string{"data-table"})

	if len(commands) != 1 {
		t.Fatalf("expected 1 command, got %d", len(commands))
	}

	cmd := commands[0]
	if cmd.Type != CommandTypeJB {
		t.Errorf("expected type %q, got %q", CommandTypeJB, cmd.Type)
	}
	if cmd.CreditCost != 2 {
		t.Errorf("expected credit cost 2, got %d", cmd.CreditCost)
	}
	if cmd.Feature != "data-table" {
		t.Errorf("expected feature %q, got %q", "data-table", cmd.Feature)
	}
}

func TestResolve_GritResource(t *testing.T) {
	r := NewCommandResolver()
	commands := r.Resolve([]string{"resource:Invoice"})

	if len(commands) != 1 {
		t.Fatalf("expected 1 command, got %d", len(commands))
	}

	cmd := commands[0]
	if cmd.Type != CommandTypeGrit {
		t.Errorf("expected type %q, got %q", CommandTypeGrit, cmd.Type)
	}
	if cmd.Command != "grit generate resource Invoice" {
		t.Errorf("expected command %q, got %q", "grit generate resource Invoice", cmd.Command)
	}
	if cmd.CreditCost != 2 {
		t.Errorf("expected credit cost 2, got %d", cmd.CreditCost)
	}
}

func TestResolve_Scaffold(t *testing.T) {
	r := NewCommandResolver()
	commands := r.Resolve([]string{"scaffold"})

	if len(commands) != 1 {
		t.Fatalf("expected 1 command, got %d", len(commands))
	}

	if commands[0].CreditCost != 5 {
		t.Errorf("expected credit cost 5 for scaffold, got %d", commands[0].CreditCost)
	}
}

func TestResolve_Unknown(t *testing.T) {
	r := NewCommandResolver()
	commands := r.Resolve([]string{"unknown-feature"})

	if len(commands) != 0 {
		t.Fatalf("expected 0 commands for unknown feature, got %d", len(commands))
	}
}

func TestResolve_Multiple(t *testing.T) {
	r := NewCommandResolver()
	commands := r.Resolve([]string{"auth-ui", "data-table", "unknown", "resource:Blog"})

	if len(commands) != 3 {
		t.Fatalf("expected 3 commands (auth-ui, data-table, resource:Blog), got %d", len(commands))
	}
}

func TestListAvailableCommands(t *testing.T) {
	r := NewCommandResolver()
	commands := r.ListAvailableCommands()

	if len(commands) == 0 {
		t.Fatal("expected at least one available command")
	}

	// All listed commands should be JB type
	for _, cmd := range commands {
		if cmd.Type != CommandTypeJB {
			t.Errorf("expected all listed commands to be JB type, got %q for %q", cmd.Type, cmd.Feature)
		}
	}
}
