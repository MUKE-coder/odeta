package executor

import (
	"bufio"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"strings"
)

// LineCallback is called for each line of command output.
type LineCallback func(line string, isStderr bool)

// ExecutionResult holds the outcome of a command execution.
type ExecutionResult struct {
	Command  string
	ExitCode int
	Output   []string
	Error    string
}

// Lines to suppress from chat output (interactive prompts, noise).
var suppressPatterns = []string{
	"would you like to install",
	"which style would you like",
	"which color would you like",
	"would you like to use css variables",
	"? would you like",
	"you can now run",
	"we suggest that you begin",
	"press any key",
	"preflight checks",
	"verifying framework",
	"validating tailwind",
	"validating import alias",
	"how would you like to proceed",
}

func shouldSuppressLine(line string) bool {
	lower := strings.ToLower(line)
	for _, pattern := range suppressPatterns {
		if strings.Contains(lower, pattern) {
			return true
		}
	}
	return false
}

// normalizeCommand adds non-interactive flags to commands.
func normalizeCommand(command string) string {
	cmd := strings.TrimSpace(command)

	// pnpm create next-app — ensure --yes and required flags
	if strings.HasPrefix(cmd, "pnpm create next-app") {
		if !strings.Contains(cmd, "--yes") {
			cmd = cmd + " --yes"
		}
		for _, flag := range []string{"--typescript", "--tailwind", "--eslint", "--app", "--src-dir"} {
			if !strings.Contains(cmd, flag) {
				cmd = cmd + " " + flag
			}
		}
		return cmd
	}

	// shadcn init — force --yes --defaults
	if strings.Contains(cmd, "shadcn@latest init") {
		cmd = regexp.MustCompile(`shadcn@latest init.*$`).
			ReplaceAllString(cmd, "shadcn@latest init --yes --defaults")
		return cmd
	}

	// shadcn add — add --yes --overwrite
	if strings.Contains(cmd, "shadcn@latest add") {
		if !strings.Contains(cmd, "--yes") {
			cmd = cmd + " --yes"
		}
		if !strings.Contains(cmd, "--overwrite") {
			cmd = cmd + " --overwrite"
		}
		return cmd
	}

	// prisma init — add --yes
	if strings.Contains(cmd, "prisma") && strings.Contains(cmd, "init") {
		if !strings.Contains(cmd, "--yes") {
			cmd = cmd + " --yes"
		}
	}

	return cmd
}

// RunCommand executes a shell command in the given directory,
// streaming output line by line via the callback.
func RunCommand(command string, workDir string, onLine LineCallback) (*ExecutionResult, error) {
	command = normalizeCommand(command)

	parts, err := parseCommand(command)
	if err != nil {
		return nil, fmt.Errorf("parse command: %w", err)
	}

	cmd := exec.Command(parts[0], parts[1:]...)
	cmd.Dir = workDir
	cmd.Env = append(os.Environ(),
		"CI=true",
		"FORCE_COLOR=0",
		"NPM_CONFIG_YES=true",
		"NEXT_TELEMETRY_DISABLED=1",
		"DO_NOT_TRACK=1",
		"ADBLOCK=1",
	)

	stdout, err := cmd.StdoutPipe()
	if err != nil {
		return nil, err
	}
	stderr, err := cmd.StderrPipe()
	if err != nil {
		return nil, err
	}

	if err := cmd.Start(); err != nil {
		return nil, fmt.Errorf("start command: %w", err)
	}

	result := &ExecutionResult{Command: command}

	stdoutDone := make(chan struct{})
	go func() {
		defer close(stdoutDone)
		scanner := bufio.NewScanner(stdout)
		for scanner.Scan() {
			line := scanner.Text()
			result.Output = append(result.Output, line)
			if onLine != nil && !shouldSuppressLine(line) {
				onLine(line, false)
			}
		}
	}()

	stderrDone := make(chan struct{})
	go func() {
		defer close(stderrDone)
		scanner := bufio.NewScanner(stderr)
		for scanner.Scan() {
			line := scanner.Text()
			result.Output = append(result.Output, line)
			if onLine != nil && !shouldSuppressLine(line) {
				onLine(line, true)
			}
		}
	}()

	<-stdoutDone
	<-stderrDone

	if err := cmd.Wait(); err != nil {
		if exitErr, ok := err.(*exec.ExitError); ok {
			result.ExitCode = exitErr.ExitCode()
			result.Error = exitErr.Error()
		} else {
			return result, err
		}
	}

	return result, nil
}

// GetProjectDir returns the working directory for a project.
func GetProjectDir(projectID string) string {
	base := os.Getenv("PROJECTS_DIR")
	if base == "" {
		base = "/tmp/odeta-projects"
	}
	return filepath.Join(base, projectID)
}

// EnsureProjectDir creates the project directory if needed.
func EnsureProjectDir(projectID string) (string, error) {
	dir := GetProjectDir(projectID)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return "", fmt.Errorf("create project dir: %w", err)
	}
	return dir, nil
}

// FindNextjsDir finds the Next.js project subdirectory (has package.json).
func FindNextjsDir(baseDir string) string {
	entries, err := os.ReadDir(baseDir)
	if err != nil {
		return baseDir
	}
	for _, entry := range entries {
		if entry.IsDir() {
			pkgPath := filepath.Join(baseDir, entry.Name(), "package.json")
			if _, err := os.Stat(pkgPath); err == nil {
				return filepath.Join(baseDir, entry.Name())
			}
		}
	}
	if _, err := os.Stat(filepath.Join(baseDir, "package.json")); err == nil {
		return baseDir
	}
	return baseDir
}

func parseCommand(command string) ([]string, error) {
	var parts []string
	var current strings.Builder
	inQuote := false
	quoteChar := rune(0)

	for _, ch := range command {
		switch {
		case inQuote && ch == quoteChar:
			inQuote = false
		case !inQuote && (ch == '"' || ch == '\''):
			inQuote = true
			quoteChar = ch
		case !inQuote && ch == ' ':
			if current.Len() > 0 {
				parts = append(parts, current.String())
				current.Reset()
			}
		default:
			current.WriteRune(ch)
		}
	}
	if current.Len() > 0 {
		parts = append(parts, current.String())
	}
	if len(parts) == 0 {
		return nil, fmt.Errorf("empty command")
	}
	return parts, nil
}
