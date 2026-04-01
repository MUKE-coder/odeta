package grit

import (
	"fmt"
	"log"
	"os/exec"
	"strings"
	"sync"
	"time"

	"gorm.io/gorm"

	"odeta/apps/api/internal/models"
)

// ProgressEvent represents a phase execution progress event.
type ProgressEvent struct {
	Type      string `json:"type"`       // phase_started, task_started, task_completed, command_output, phase_completed, error
	PhaseID   uint   `json:"phase_id"`
	Phase     int    `json:"phase"`
	Task      string `json:"task,omitempty"`
	Output    string `json:"output,omitempty"`
	Status    string `json:"status,omitempty"`
	Timestamp string `json:"timestamp"`
}

// PhaseExecutor runs project phases sequentially and streams progress.
type PhaseExecutor struct {
	db          *gorm.DB
	resolver    *CommandResolver
	subscribers map[uint][]chan ProgressEvent
	mu          sync.RWMutex
}

// NewPhaseExecutor creates a new phase executor.
func NewPhaseExecutor(db *gorm.DB) *PhaseExecutor {
	return &PhaseExecutor{
		db:          db,
		resolver:    NewCommandResolver(),
		subscribers: make(map[uint][]chan ProgressEvent),
	}
}

// Subscribe returns a channel that receives progress events for a project.
func (e *PhaseExecutor) Subscribe(projectID uint) chan ProgressEvent {
	e.mu.Lock()
	defer e.mu.Unlock()

	ch := make(chan ProgressEvent, 100)
	e.subscribers[projectID] = append(e.subscribers[projectID], ch)
	return ch
}

// Unsubscribe removes a channel from project subscribers.
func (e *PhaseExecutor) Unsubscribe(projectID uint, ch chan ProgressEvent) {
	e.mu.Lock()
	defer e.mu.Unlock()

	subs := e.subscribers[projectID]
	for i, sub := range subs {
		if sub == ch {
			e.subscribers[projectID] = append(subs[:i], subs[i+1:]...)
			close(ch)
			break
		}
	}
}

// emit sends a progress event to all subscribers of a project.
func (e *PhaseExecutor) emit(projectID uint, event ProgressEvent) {
	event.Timestamp = time.Now().UTC().Format(time.RFC3339)

	e.mu.RLock()
	defer e.mu.RUnlock()

	for _, ch := range e.subscribers[projectID] {
		select {
		case ch <- event:
		default:
			// Channel full, skip (non-blocking)
		}
	}
}

// Execute runs all phases for a project sequentially.
func (e *PhaseExecutor) Execute(projectID uint) error {
	var phases []models.ProjectPhase
	if err := e.db.Where("project_id = ?", projectID).Order("phase_number asc").Find(&phases).Error; err != nil {
		return fmt.Errorf("failed to load phases: %w", err)
	}

	// Update project status
	e.db.Model(&models.Project{}).Where("id = ?", projectID).Update("status", models.ProjectStatusBuilding)

	for _, phase := range phases {
		if err := e.executePhase(projectID, &phase); err != nil {
			// Mark phase as failed
			now := time.Now()
			e.db.Model(&phase).Updates(map[string]interface{}{
				"status":       models.PhaseStatusFailed,
				"completed_at": &now,
			})

			e.emit(projectID, ProgressEvent{
				Type:    "error",
				PhaseID: phase.ID,
				Phase:   phase.PhaseNumber,
				Output:  err.Error(),
				Status:  "failed",
			})

			// Update project status
			e.db.Model(&models.Project{}).Where("id = ?", projectID).Update("status", models.ProjectStatusFailed)
			return err
		}
	}

	// Update project status to built
	e.db.Model(&models.Project{}).Where("id = ?", projectID).Update("status", models.ProjectStatusBuilt)

	return nil
}

func (e *PhaseExecutor) executePhase(projectID uint, phase *models.ProjectPhase) error {
	now := time.Now()

	// Mark phase as in progress
	e.db.Model(phase).Updates(map[string]interface{}{
		"status":     models.PhaseStatusInProgress,
		"started_at": &now,
	})

	e.emit(projectID, ProgressEvent{
		Type:    "phase_started",
		PhaseID: phase.ID,
		Phase:   phase.PhaseNumber,
		Task:    phase.Title,
		Status:  "in_progress",
	})

	// Parse tasks from the phase's tasks JSON (stored as text)
	tasks := strings.Split(phase.Tasks, "\n")
	for _, task := range tasks {
		task = strings.TrimSpace(task)
		if task == "" {
			continue
		}

		e.emit(projectID, ProgressEvent{
			Type:    "task_started",
			PhaseID: phase.ID,
			Phase:   phase.PhaseNumber,
			Task:    task,
		})

		// Identify command type and execute
		if strings.HasPrefix(task, "grit ") || strings.HasPrefix(task, "pnpm dlx shadcn") {
			output, err := e.runCommand(task, ".")
			if err != nil {
				return fmt.Errorf("command failed: %s: %w", task, err)
			}
			e.emit(projectID, ProgressEvent{
				Type:    "command_output",
				PhaseID: phase.ID,
				Phase:   phase.PhaseNumber,
				Task:    task,
				Output:  output,
			})
		}

		e.emit(projectID, ProgressEvent{
			Type:    "task_completed",
			PhaseID: phase.ID,
			Phase:   phase.PhaseNumber,
			Task:    task,
			Status:  "completed",
		})
	}

	// Mark phase as completed
	completedAt := time.Now()
	e.db.Model(phase).Updates(map[string]interface{}{
		"status":       models.PhaseStatusCompleted,
		"completed_at": &completedAt,
	})

	e.emit(projectID, ProgressEvent{
		Type:    "phase_completed",
		PhaseID: phase.ID,
		Phase:   phase.PhaseNumber,
		Task:    phase.Title,
		Status:  "completed",
	})

	return nil
}

// runCommand executes a shell command and returns the combined output.
func (e *PhaseExecutor) runCommand(cmd string, projectDir string) (string, error) {
	parts := strings.Fields(cmd)
	if len(parts) == 0 {
		return "", fmt.Errorf("empty command")
	}

	c := exec.Command(parts[0], parts[1:]...)
	c.Dir = projectDir

	out, err := c.CombinedOutput()
	output := string(out)

	log.Printf("[PhaseExecutor] %s → %s", cmd, truncate(output, 200))

	return output, err
}

func truncate(s string, maxLen int) string {
	if len(s) <= maxLen {
		return s
	}
	return s[:maxLen] + "..."
}
