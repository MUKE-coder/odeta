package executor

import (
	"fmt"
	"regexp"
	"strings"
)

// ParsedCommand represents a command extracted from AI output.
type ParsedCommand struct {
	Label   string
	Command string
}

var commandBlockRe = regexp.MustCompile(`(?s)<command(?:\s+label="([^"]*)")?\s*>\s*(.*?)\s*</command>`)
var jbCommandRe = regexp.MustCompile(`(?s)<jb-command(?:\s+component="([^"]*)")?(?:\s+url="([^"]*)")?\s*>\s*(.*?)\s*</jb-command>`)

// ExtractCommands pulls all <command> and <jb-command> blocks from AI output.
func ExtractCommands(text string) []ParsedCommand {
	var commands []ParsedCommand

	for _, match := range commandBlockRe.FindAllStringSubmatch(text, -1) {
		commands = append(commands, ParsedCommand{
			Label:   match[1],
			Command: strings.TrimSpace(match[2]),
		})
	}

	for _, match := range jbCommandRe.FindAllStringSubmatch(text, -1) {
		component := match[1]
		url := match[2]
		if url != "" {
			commands = append(commands, ParsedCommand{
				Label:   fmt.Sprintf("Install %s", component),
				Command: fmt.Sprintf("pnpm dlx shadcn@latest add %s", url),
			})
		}
	}

	return commands
}

// ExtractCommandsFromPlan extracts executable commands from <plan> ITEM: lines.
func ExtractCommandsFromPlan(text string) []ParsedCommand {
	var commands []ParsedCommand

	planRe := regexp.MustCompile(`(?s)<plan[^>]*>(.*?)</plan>`)
	planMatch := planRe.FindStringSubmatch(text)
	if len(planMatch) < 2 {
		return commands
	}

	for _, line := range strings.Split(planMatch[1], "\n") {
		line = strings.TrimSpace(line)
		if !strings.HasPrefix(line, "ITEM:") {
			continue
		}

		parts := strings.SplitN(line[5:], "|", 3)
		if len(parts) < 3 {
			continue
		}

		itemType := strings.TrimSpace(parts[0])
		label := strings.TrimSpace(parts[1])
		value := strings.TrimSpace(parts[2])

		switch itemType {
		case "scaffold":
			if strings.HasPrefix(value, "pnpm") {
				commands = append(commands, ParsedCommand{Label: label, Command: value})
			}
		case "jb":
			if strings.HasPrefix(value, "http") {
				commands = append(commands, ParsedCommand{
					Label:   label,
					Command: fmt.Sprintf("pnpm dlx shadcn@latest add %s --yes", value),
				})
			} else if strings.HasPrefix(value, "pnpm") {
				commands = append(commands, ParsedCommand{Label: label, Command: value})
			}
		case "code":
			// Custom code — AI handles separately, skip execution
		}
	}

	return commands
}

// ExtractAllCommands extracts commands from both <command>/<jb-command> blocks AND <plan> ITEM: lines.
func ExtractAllCommands(text string) []ParsedCommand {
	commands := ExtractCommands(text)
	planCommands := ExtractCommandsFromPlan(text)
	// Deduplicate — plan commands first, then any standalone commands not in plan
	seen := make(map[string]bool)
	var merged []ParsedCommand
	for _, cmd := range planCommands {
		seen[cmd.Command] = true
		merged = append(merged, cmd)
	}
	for _, cmd := range commands {
		if !seen[cmd.Command] {
			merged = append(merged, cmd)
		}
	}
	return merged
}

// IsSafeCommand checks that a command is in the allowed list.
func IsSafeCommand(command string) bool {
	// Reject shell metacharacters
	dangerous := []string{"&&", "||", ";", "|", ">", "<", "`", "$(", "../", "~/"}
	for _, d := range dangerous {
		if strings.Contains(command, d) {
			return false
		}
	}

	allowed := []string{
		"pnpm create next-app",
		"pnpm dlx shadcn@latest",
		"pnpm dlx prisma",
		"pnpm add ",
		"pnpm install",
		"pnpm dev",
		"pnpm build",
		"pnpm run ",
	}
	cmdLower := strings.ToLower(strings.TrimSpace(command))
	for _, prefix := range allowed {
		if strings.HasPrefix(cmdLower, strings.ToLower(prefix)) {
			return true
		}
	}
	return false
}
