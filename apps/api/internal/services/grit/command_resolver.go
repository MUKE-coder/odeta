package grit

// CommandType indicates whether a command is a Grit CLI command or a JB shadcn command.
type CommandType string

const (
	CommandTypeGrit    CommandType = "grit"
	CommandTypeJB      CommandType = "jb"
	CommandTypeCodegen CommandType = "codegen"
)

// Command represents a resolved command to execute.
type Command struct {
	Type        CommandType `json:"type"`
	Command     string      `json:"command"`
	Description string      `json:"description"`
	Feature     string      `json:"feature"`
	CreditCost  int         `json:"credit_cost"`
}

// jbCommands maps feature keys to their JB shadcn registry URLs.
var jbCommands = map[string]struct {
	URL         string
	Description string
}{
	"auth-ui":          {URL: "https://better-auth-ui.desishub.com/r/auth-components.json", Description: "Authentication UI (sign in, sign up, OAuth, password reset)"},
	"payments-ui":      {URL: "https://stripe-ui-component.desishub.com/r/stripe-ui-component.json", Description: "Stripe payments UI (pricing, checkout, billing)"},
	"file-upload":      {URL: "https://file-storage-registry.vercel.app/r/file-storage.json", Description: "File upload & storage (R2/S3 integration)"},
	"multi-step-form":  {URL: "https://jb.desishub.com/r/multi-step-form.json", Description: "Multi-step form with validation"},
	"cart":             {URL: "https://jb.desishub.com/r/zustand-cart.json", Description: "Shopping cart (Zustand state management)"},
	"consent":          {URL: "https://jb.desishub.com/r/consent-manager.json", Description: "Cookie consent / GDPR banner"},
	"data-table":       {URL: "https://jb.desishub.com/r/data-table.json", Description: "Data tables (TanStack Table with sort, filter, pagination)"},
	"copy-button":      {URL: "https://jb.desishub.com/r/copy-button.json", Description: "Copy to clipboard button"},
	"currency-input":   {URL: "https://jb.desishub.com/r/currency-input.json", Description: "Currency input field"},
	"editable-cell":    {URL: "https://jb.desishub.com/r/editable-cell.json", Description: "Editable table cells"},
	"glow-card":        {URL: "https://jb.desishub.com/r/glow-card-grid.json", Description: "Glow card grid"},
	"middle-truncation": {URL: "https://jb.desishub.com/r/middle-truncation.json", Description: "Middle truncation text"},
	"quantity-control":  {URL: "https://jb.desishub.com/r/quantity-control.json", Description: "Quantity control input"},
	"scroll-fade":      {URL: "https://jb.desishub.com/r/scroll-fade-effect.json", Description: "Scroll fade effect"},
	"searchable-select": {URL: "https://jb.desishub.com/r/searchable-select.json", Description: "Searchable select dropdown"},
	"shimmering-text":  {URL: "https://jb.desishub.com/r/shimmering-text.json", Description: "Shimmering text effect"},
	"tag-input":        {URL: "https://jb.desishub.com/r/tag-input.json", Description: "Tag input component"},
	"testimonial":      {URL: "https://jb.desishub.com/r/testimonial.json", Description: "Testimonial cards"},
	"work-experience":  {URL: "https://jb.desishub.com/r/work-experience.json", Description: "Work experience / timeline"},
}

// CommandResolver maps requested features to Grit or JB commands.
type CommandResolver struct{}

// NewCommandResolver creates a new command resolver.
func NewCommandResolver() *CommandResolver {
	return &CommandResolver{}
}

// Resolve takes a list of feature identifiers and returns the commands to run.
// Priority: Grit command > JB command > code generation.
func (r *CommandResolver) Resolve(features []string) []Command {
	var commands []Command

	for _, feature := range features {
		if cmd, ok := r.resolveFeature(feature); ok {
			commands = append(commands, cmd)
		}
	}

	return commands
}

func (r *CommandResolver) resolveFeature(feature string) (Command, bool) {
	// Check JB commands first
	if jb, ok := jbCommands[feature]; ok {
		return Command{
			Type:        CommandTypeJB,
			Command:     "pnpm dlx shadcn@latest add " + jb.URL,
			Description: jb.Description,
			Feature:     feature,
			CreditCost:  2,
		}, true
	}

	// Check for Grit resource generation pattern (e.g., "resource:Invoice")
	if len(feature) > 9 && feature[:9] == "resource:" {
		resourceName := feature[9:]
		return Command{
			Type:        CommandTypeGrit,
			Command:     "grit generate resource " + resourceName,
			Description: "Generate " + resourceName + " resource (model + API + admin + types + hooks)",
			Feature:     feature,
			CreditCost:  2,
		}, true
	}

	// Check for scaffold command
	if feature == "scaffold" {
		return Command{
			Type:        CommandTypeGrit,
			Command:     "grit new projectname --double --next",
			Description: "Scaffold Grit Double project (Go API + Next.js)",
			Feature:     feature,
			CreditCost:  5,
		}, true
	}

	return Command{}, false
}

// ListAvailableCommands returns all available JB commands for display.
func (r *CommandResolver) ListAvailableCommands() []Command {
	var commands []Command
	for feature, jb := range jbCommands {
		commands = append(commands, Command{
			Type:        CommandTypeJB,
			Command:     "pnpm dlx shadcn@latest add " + jb.URL,
			Description: jb.Description,
			Feature:     feature,
			CreditCost:  2,
		})
	}
	return commands
}
