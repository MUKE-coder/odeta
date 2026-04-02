package registry

import (
	"bufio"
	"fmt"
	"log"
	"os"
	"strings"
	"time"
)

// Component represents a JB component from the registry.
type Component struct {
	ID             string   `json:"id"`
	Name           string   `json:"name"`
	Category       string   `json:"category"`
	Command        string   `json:"command"`
	Triggers       []string `json:"triggers"`
	WhatItIncludes string   `json:"what_it_includes"`
	WhenToUse      string   `json:"when_to_use"`
	EnvVarsNeeded  []string `json:"env_vars_needed"`
	CreditsCost    int      `json:"credits_cost"`
}

// Registry holds all loaded components.
type Registry struct {
	Components []Component
	LoadedAt   time.Time
}

// GlobalRegistry is the singleton registry instance.
var GlobalRegistry *Registry

// LoadRegistry reads and parses COMPONENT_REGISTRY.md.
func LoadRegistry(path string) (*Registry, error) {
	f, err := os.Open(path)
	if err != nil {
		return nil, fmt.Errorf("opening registry file: %w", err)
	}
	defer f.Close()

	reg := &Registry{LoadedAt: time.Now()}
	var current *Component
	scanner := bufio.NewScanner(f)

	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" || line == "---" {
			continue
		}
		if strings.HasPrefix(line, "#") && !strings.HasPrefix(line, "## COMPONENT:") {
			continue
		}

		if strings.HasPrefix(line, "## COMPONENT:") {
			if current != nil {
				reg.Components = append(reg.Components, *current)
			}
			id := strings.TrimSpace(strings.TrimPrefix(line, "## COMPONENT:"))
			current = &Component{ID: id, CreditsCost: 2}
			continue
		}

		if current == nil {
			continue
		}

		if v, ok := parseField(line, "NAME:"); ok {
			current.Name = v
		} else if v, ok := parseField(line, "CATEGORY:"); ok {
			current.Category = v
		} else if v, ok := parseField(line, "COMMAND:"); ok {
			current.Command = v
		} else if v, ok := parseField(line, "TRIGGERS:"); ok {
			for _, t := range strings.Split(v, ",") {
				t = strings.TrimSpace(t)
				if t != "" {
					current.Triggers = append(current.Triggers, t)
				}
			}
		} else if v, ok := parseField(line, "WHAT_IT_INCLUDES:"); ok {
			current.WhatItIncludes = v
		} else if v, ok := parseField(line, "WHEN_TO_USE:"); ok {
			current.WhenToUse = v
		} else if v, ok := parseField(line, "ENV_VARS_NEEDED:"); ok {
			if v != "none" {
				for _, e := range strings.Split(v, ",") {
					e = strings.TrimSpace(e)
					if e != "" {
						current.EnvVarsNeeded = append(current.EnvVarsNeeded, e)
					}
				}
			}
		} else if v, ok := parseField(line, "CREDITS_COST:"); ok {
			fmt.Sscanf(v, "%d", &current.CreditsCost)
		}
	}

	if current != nil {
		reg.Components = append(reg.Components, *current)
	}

	GlobalRegistry = reg
	log.Printf("✓ Loaded %d components from registry", len(reg.Components))
	return reg, nil
}

// MatchComponents returns components whose triggers match words in the input text.
func (r *Registry) MatchComponents(text string) []Component {
	textLower := strings.ToLower(text)
	var matched []Component
	seen := map[string]bool{}

	for _, comp := range r.Components {
		for _, trigger := range comp.Triggers {
			if strings.Contains(textLower, strings.ToLower(trigger)) {
				if !seen[comp.ID] {
					matched = append(matched, comp)
					seen[comp.ID] = true
				}
				break
			}
		}
	}
	return matched
}

// BuildContextForAI returns a compact string for injection into the AI system prompt.
func (r *Registry) BuildContextForAI() string {
	var sb strings.Builder
	sb.WriteString("AVAILABLE COMPONENT COMMANDS (use these instead of writing code from scratch):\n\n")

	for _, comp := range r.Components {
		sb.WriteString(fmt.Sprintf("## %s\n", comp.Name))
		sb.WriteString(fmt.Sprintf("Command: %s\n", comp.Command))
		sb.WriteString(fmt.Sprintf("Use when: %s\n", comp.WhenToUse))
		if len(comp.EnvVarsNeeded) > 0 {
			sb.WriteString(fmt.Sprintf("Env vars: %s\n", strings.Join(comp.EnvVarsNeeded, ", ")))
		}
		sb.WriteString("\n")
	}
	return sb.String()
}

func parseField(line, prefix string) (string, bool) {
	if strings.HasPrefix(line, prefix) {
		return strings.TrimSpace(strings.TrimPrefix(line, prefix)), true
	}
	return "", false
}
