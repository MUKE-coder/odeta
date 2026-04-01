package cron

import (
	"fmt"
	"log"

	"github.com/hibiken/asynq"
)

// Task represents a registered cron task for display purposes.
type Task struct {
	Name     string `json:"name"`
	Schedule string `json:"schedule"`
	Type     string `json:"type"`
}

// RegisteredTasks holds the list of cron tasks for the admin API.
var RegisteredTasks []Task

// Scheduler wraps asynq.Scheduler for cron-like job scheduling.
type Scheduler struct {
	scheduler *asynq.Scheduler
}

// New creates a new cron Scheduler connected to Redis.
func New(redisURL string) (*Scheduler, error) {
	redisOpt, err := asynq.ParseRedisURI(redisURL)
	if err != nil {
		return nil, fmt.Errorf("parsing redis URL for cron: %w", err)
	}

	scheduler := asynq.NewScheduler(redisOpt, nil)

	// Register built-in cron tasks
	RegisteredTasks = []Task{}

	// Cleanup expired tokens — every hour
	_, err = scheduler.Register("0 * * * *", asynq.NewTask("tokens:cleanup", nil))
	if err != nil {
		return nil, fmt.Errorf("registering tokens cleanup: %w", err)
	}
	RegisteredTasks = append(RegisteredTasks, Task{
		Name:     "Cleanup expired tokens",
		Schedule: "0 * * * *",
		Type:     "tokens:cleanup",
	})

	// Credit reset — daily at midnight UTC
	_, err = scheduler.Register("0 0 * * *", asynq.NewTask("credits:reset", nil))
	if err != nil {
		return nil, fmt.Errorf("registering credits reset: %w", err)
	}
	RegisteredTasks = append(RegisteredTasks, Task{
		Name:     "Monthly credit reset",
		Schedule: "0 0 * * *",
		Type:     "credits:reset",
	})

	// grit:cron-tasks

	return &Scheduler{scheduler: scheduler}, nil
}

// Start begins executing scheduled tasks.
func (s *Scheduler) Start() error {
	go func() {
		if err := s.scheduler.Run(); err != nil {
			log.Printf("Cron scheduler error: %v", err)
		}
	}()
	return nil
}

// Stop shuts down the scheduler gracefully.
func (s *Scheduler) Stop() {
	s.scheduler.Shutdown()
}
