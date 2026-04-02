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
