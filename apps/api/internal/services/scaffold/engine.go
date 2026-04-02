package scaffold

import (
	"fmt"
	"strings"

	"odeta/apps/api/internal/services/registry"
)

// EnvVar represents a required environment variable.
type EnvVar struct {
	Key      string `json:"key"`
	Required bool   `json:"required"`
	Category string `json:"category"`
}

// ScaffoldPlan describes everything needed to create a project.
type ScaffoldPlan struct {
	ProjectName      string               `json:"project_name"`
	ProjectType      string               `json:"project_type"`
	CreateNextApp    string               `json:"create_next_app"`
	ShadcnInit       string               `json:"shadcn_init"`
	BaseComponents   []string             `json:"base_components"`
	JBComponents     []registry.Component `json:"jb_components"`
	EnvVarsNeeded    []EnvVar             `json:"env_vars_needed"`
	EstimatedCredits int                  `json:"estimated_credits"`
}

// BuildPlan creates a scaffold plan based on project type and user answers.
func BuildPlan(projectName, projectType string, answerText string, reg *registry.Registry) ScaffoldPlan {
	slug := slugify(projectName)

	plan := ScaffoldPlan{
		ProjectName: slug,
		ProjectType: projectType,
		CreateNextApp: fmt.Sprintf(
			"pnpm create next-app@latest %s --typescript --tailwind --eslint --app --src-dir --import-alias '@/*' --yes",
			slug,
		),
		ShadcnInit: "pnpm dlx shadcn@latest init --defaults",
		BaseComponents: []string{
			"button", "input", "label", "card", "dialog", "sheet",
			"badge", "avatar", "dropdown-menu", "separator", "tabs",
			"toast", "skeleton", "progress", "alert",
		},
	}

	// Match JB components from answer text
	if reg != nil {
		plan.JBComponents = reg.MatchComponents(answerText)
	}

	// Collect env vars
	envVarSet := map[string]bool{}
	for _, comp := range plan.JBComponents {
		for _, env := range comp.EnvVarsNeeded {
			if !envVarSet[env] {
				plan.EnvVarsNeeded = append(plan.EnvVarsNeeded, EnvVar{
					Key:      env,
					Required: true,
					Category: comp.Category,
				})
				envVarSet[env] = true
			}
		}
	}

	// Always add base env vars
	baseEnvVars := []EnvVar{
		{Key: "DATABASE_URL", Required: true, Category: "database"},
		{Key: "NEXT_PUBLIC_APP_URL", Required: true, Category: "base"},
	}
	for _, env := range baseEnvVars {
		if !envVarSet[env.Key] {
			plan.EnvVarsNeeded = append(plan.EnvVarsNeeded, env)
		}
	}

	// Estimate credits: 5 for scaffold + 2 per JB component
	plan.EstimatedCredits = 5
	for _, comp := range plan.JBComponents {
		plan.EstimatedCredits += comp.CreditsCost
	}

	return plan
}

func slugify(name string) string {
	s := strings.ToLower(name)
	s = strings.Map(func(r rune) rune {
		if (r >= 'a' && r <= 'z') || (r >= '0' && r <= '9') || r == '-' || r == ' ' {
			return r
		}
		return -1
	}, s)
	s = strings.ReplaceAll(s, " ", "-")
	// Remove consecutive dashes
	for strings.Contains(s, "--") {
		s = strings.ReplaceAll(s, "--", "-")
	}
	s = strings.Trim(s, "-")
	if len(s) > 40 {
		s = s[:40]
	}
	if s == "" {
		s = "my-project"
	}
	return s
}
