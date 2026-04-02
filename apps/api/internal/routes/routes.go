package routes

import (
	"context"
	"log"
	"net/http"
	"os/exec"
	"time"

	"github.com/MUKE-coder/gin-docs/gindocs"
	"github.com/MUKE-coder/gorm-studio/studio"
	"github.com/MUKE-coder/pulse/pulse"
	"github.com/MUKE-coder/sentinel"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"odeta/apps/api/internal/ai"
	"odeta/apps/api/internal/cache"
	"odeta/apps/api/internal/config"
	"odeta/apps/api/internal/handlers"
	"odeta/apps/api/internal/mail"
	"odeta/apps/api/internal/middleware"
	"odeta/apps/api/internal/models"
	"odeta/apps/api/internal/jobs"
	"odeta/apps/api/internal/services"
	"odeta/apps/api/internal/services/credits"
	"odeta/apps/api/internal/services/dgateway"
	githubsvc "odeta/apps/api/internal/services/github"
	"odeta/apps/api/internal/services/grit"
	"odeta/apps/api/internal/services/devserver"
	orbitasvc "odeta/apps/api/internal/services/orbita"
	sandboxsvc "odeta/apps/api/internal/services/sandbox"
	stripesvc "odeta/apps/api/internal/services/stripe"
	"odeta/apps/api/internal/handlers/webhooks"
	"odeta/apps/api/internal/storage"
)

// Services holds all Phase 4 services for dependency injection.
type Services struct {
	Cache   *cache.Cache
	Storage *storage.Storage
	Mailer  *mail.Mailer
	AI      *ai.AI
	Jobs    *jobs.Client
}

// Setup configures all routes and returns the Gin engine.
func Setup(db *gorm.DB, cfg *config.Config, svc *Services) *gin.Engine {
	if cfg.AppEnv == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	r := gin.New()

	// Global middleware
	r.Use(middleware.Maintenance())
	r.Use(middleware.RequestID())
	r.Use(middleware.Logger())
	r.Use(gin.Recovery())
	r.Use(middleware.CORS(cfg.CORSOrigins))
	r.Use(middleware.Gzip())

	// Mount Sentinel security suite (WAF, rate limiting, auth shield, anomaly detection)
	if cfg.SentinelEnabled {
		sentinel.Mount(r, db, sentinel.Config{
			Dashboard: sentinel.DashboardConfig{
				Username:  cfg.SentinelUsername,
				Password:  cfg.SentinelPassword,
				SecretKey: cfg.SentinelSecretKey,
			},
			WAF: sentinel.WAFConfig{
				Enabled: true,
				Mode:    sentinel.ModeLog, // Switch to sentinel.ModeBlock in production
			},
			RateLimit: sentinel.RateLimitConfig{
				Enabled: true,
				ByIP:    &sentinel.Limit{Requests: 100, Window: 1 * time.Minute},
				ByRoute: map[string]sentinel.Limit{
					"/api/auth/login":    {Requests: 5, Window: 15 * time.Minute},
					"/api/auth/register": {Requests: 3, Window: 15 * time.Minute},
					"/api/chat":          {Requests: 20, Window: 1 * time.Minute},
					"/api/generate":      {Requests: 5, Window: 1 * time.Minute},
				},
			},
			AuthShield: sentinel.AuthShieldConfig{
				Enabled:    true,
				LoginRoute: "/api/auth/login",
			},
			Anomaly: sentinel.AnomalyConfig{
				Enabled: true,
			},
			Geo: sentinel.GeoConfig{
				Enabled: true,
			},
		})
		log.Println("Sentinel security suite mounted at /sentinel")
	}

	// Mount GORM Studio
	if cfg.GORMStudioEnabled {
		studioCfg := studio.Config{
			Prefix: "/studio",
		}
		if cfg.GORMStudioUsername != "" && cfg.GORMStudioPassword != "" {
			studioCfg.AuthMiddleware = gin.BasicAuth(gin.Accounts{
				cfg.GORMStudioUsername: cfg.GORMStudioPassword,
			})
		}
		studio.Mount(r, db, []interface{}{&models.User{}, &models.Upload{}, &models.Blog{}, &models.Project{}, &models.Conversation{}, &models.ProjectPhase{}, &models.CreditLog{}, &models.Deployment{}, &models.Subscription{}, /* grit:studio */}, studioCfg)
		log.Println("GORM Studio mounted at /studio")
	}

	// API Documentation (gin-docs — auto-generated from routes + models)
	gindocs.Mount(r, db, gindocs.Config{
		Title:       cfg.AppName + " API",
		Description: "REST API built with [Grit](https://gritframework.dev) — Go + React meta-framework.",
		Version:     "1.0.0",
		UI:          gindocs.UIScalar,
		ScalarTheme: "kepler",
		Models:      []interface{}{&models.User{}, &models.Upload{}, &models.Blog{}},
		Auth: gindocs.AuthConfig{
			Type:         gindocs.AuthBearer,
			BearerFormat: "JWT",
		},
	})
	log.Println("API docs available at /docs")

	// Mount Pulse observability (request tracing, DB monitoring, runtime metrics, error tracking)
	if cfg.PulseEnabled {
		p := pulse.Mount(r, db, pulse.Config{
			AppName: cfg.AppName,
			DevMode: cfg.IsDevelopment(),
			Dashboard: pulse.DashboardConfig{
				Username: cfg.PulseUsername,
				Password: cfg.PulsePassword,
			},
			Tracing: pulse.TracingConfig{
				ExcludePaths: []string{"/studio/*", "/sentinel/*", "/docs/*", "/pulse/*"},
			},
			Alerts: pulse.AlertConfig{},
			Prometheus: pulse.PrometheusConfig{
				Enabled: true,
			},
		})

		// Register health checks for connected services
		if svc.Cache != nil {
			p.AddHealthCheck(pulse.HealthCheck{
				Name:     "redis",
				Type:     "redis",
				Critical: false,
				CheckFunc: func(ctx context.Context) error {
					return svc.Cache.Client().Ping(ctx).Err()
				},
			})
		}

		log.Println("Pulse observability mounted at /pulse")
	}

	// Auth service
	authService := &services.AuthService{
		Secret:        cfg.JWTSecret,
		AccessExpiry:  cfg.JWTAccessExpiry,
		RefreshExpiry: cfg.JWTRefreshExpiry,
	}

	// Credits service (used by auth + credits handler)
	creditsService := credits.New(db, svc.Cache)

	// Handlers
	authHandler := &handlers.AuthHandler{
		DB:          db,
		AuthService: authService,
		Config:      cfg,
		Credits:     creditsService,
	}
	userHandler := &handlers.UserHandler{
		DB: db,
	}
	uploadHandler := &handlers.UploadHandler{
		DB:      db,
		Storage: svc.Storage,
		Jobs:    svc.Jobs,
	}
	aiHandler := &handlers.AIHandler{
		AI: svc.AI,
	}
	jobsHandler := &handlers.JobsHandler{
		RedisURL: cfg.RedisURL,
	}
	cronHandler := &handlers.CronHandler{}
	blogHandler := handlers.NewBlogHandler(db)
	uiRegistryHandler := handlers.NewUIRegistryHandler(db, cfg.AppURL)
	totpHandler := &handlers.TOTPHandler{
		DB:          db,
		AuthService: authService,
		Issuer:      cfg.TOTPIssuer,
	}
	projectHandler := &handlers.ProjectHandler{
		DB: db,
	}
	conversationHandler := &handlers.ConversationHandler{
		DB: db,
	}
	projectPhaseHandler := &handlers.ProjectPhaseHandler{
		DB: db,
	}
	creditLogHandler := &handlers.CreditLogHandler{
		DB: db,
	}
	deploymentHandler := &handlers.DeploymentHandler{
		DB: db,
	}
	subscriptionHandler := &handlers.SubscriptionHandler{
		DB: db,
	}
	creditsHandler := &handlers.CreditsHandler{
		Credits: creditsService,
	}

	// Odeta services
	phaseExecutor := grit.NewPhaseExecutor(db)
	var githubService *githubsvc.Service
	if cfg.GithubAppID != "" {
		githubService = githubsvc.New(cfg.GithubAppID, cfg.GithubAppPrivateKey)
	}
	var orbitaService *orbitasvc.Service
	if cfg.OrbitaAPIKey != "" {
		orbitaService = orbitasvc.New(cfg.OrbitaAPIKey)
	}
	// File management handler
	fileHandler := &handlers.FileHandler{
		DB: db,
	}

	// GitHub handler
	githubHandler := &handlers.GitHubHandler{
		DB:     db,
		GitHub: githubService,
	}

	// Dev server handler
	devServerManager := devserver.NewManager(3100)
	devServerHandler := &handlers.DevServerHandler{
		Manager: devServerManager,
	}

	// Stripe service (kept for webhook handler compatibility)
	var stripeService *stripesvc.Service
	if cfg.StripeSecretKey != "" {
		stripeService = stripesvc.New(cfg.StripeSecretKey, cfg.FrontendURL)
		log.Println("Stripe billing configured")
	}
	_ = stripeService

	// DGateway service (primary billing)
	var dgatewayService *dgateway.Service
	if cfg.DGatewayAPIKey != "" {
		callbackURL := cfg.AppURL + "/api/webhooks/dgateway"
		dgatewayService = dgateway.New(cfg.DGatewayAPIKey, callbackURL)
		log.Println("DGateway billing configured")
	}

	// Billing handler (DGateway)
	billingHandler := &handlers.BillingHandler{
		DB:       db,
		DGateway: dgatewayService,
		Credits:  creditsService,
	}

	// Webhook handlers
	stripeWebhook := &webhooks.StripeWebhook{
		DB:            db,
		Credits:       creditsService,
		WebhookSecret: cfg.StripeWebhookSecret,
	}
	dgatewayWebhook := &webhooks.DGatewayWebhook{
		DB:      db,
		Credits: creditsService,
	}
	githubWebhook := &webhooks.GitHubWebhook{
		DB:            db,
		WebhookSecret: cfg.GithubClientSecret, // reuse OAuth secret for webhook verification
	}
	orbitaWebhook := &webhooks.OrbitaWebhook{
		DB: db,
	}

	// Odeta handlers
	// Docker sandbox manager — runs commands in isolated containers
	var dockerManager *sandboxsvc.DockerManager
	// Check if Docker is available
	if _, err := exec.LookPath("docker"); err == nil {
		dockerManager = sandboxsvc.NewDockerManager("odeta-sandbox")
		log.Println("Docker sandbox execution configured")
	} else {
		log.Println("Docker not available — commands will be emitted for frontend")
	}

	odetaChatHandler := &handlers.OdetaChatHandler{
		DB:      db,
		AI:      svc.AI,
		Credits: creditsService,
		Docker:  dockerManager,
	}
	generateHandler := &handlers.GenerateHandler{
		DB:       db,
		Credits:  creditsService,
		Executor: phaseExecutor,
	}
	adminOdetaHandler := &handlers.AdminHandler{
		DB:      db,
		Credits: creditsService,
	}
	deployHandler := &handlers.DeployHandler{
		DB:      db,
		Credits: creditsService,
		Orbita:  orbitaService,
	}
	// grit:handlers

	// Health check
	r.GET("/api/health", func(c *gin.Context) {
		dbStatus := "ok"
		sqlDB, err := db.DB()
		if err != nil || sqlDB.Ping() != nil {
			dbStatus = "error"
		}

		redisStatus := "ok"
		if svc.Cache == nil {
			redisStatus = "not configured"
		}

		status := "ok"
		if dbStatus != "ok" {
			status = "degraded"
		}

		c.JSON(http.StatusOK, gin.H{
			"status":  status,
			"version": "1.0.0",
			"db":      dbStatus,
			"redis":   redisStatus,
		})
	})

	// Public Grit UI component registry (shadcn-compatible)
	r.GET("/r.json", uiRegistryHandler.GetRegistry)
	r.GET("/r/:name", uiRegistryHandler.GetComponent)

	// Public blog routes (no auth required)
	blogs := r.Group("/api/blogs")
	{
		blogs.GET("", blogHandler.ListPublished)
		blogs.GET("/:slug", blogHandler.GetBySlug)
	}

	// Public auth routes — Google OAuth only (email/password disabled)
	auth := r.Group("/api/auth")
	{
		auth.POST("/refresh", authHandler.Refresh)
	}

	// OAuth2 social login (Google)
	oauth := auth.Group("/oauth")
	{
		oauth.GET("/:provider", authHandler.OAuthBegin)
		oauth.GET("/:provider/callback", authHandler.OAuthCallback)
	}

	// TOTP verification (public — uses pending tokens, not JWT)
	auth.POST("/totp/verify", totpHandler.Verify)
	auth.POST("/totp/backup-codes/verify", totpHandler.VerifyBackupCode)

	// Protected routes
	protected := r.Group("/api")
	protected.Use(middleware.Auth(db, authService))
	{
		protected.GET("/auth/me", authHandler.Me)
		protected.POST("/auth/logout", authHandler.Logout)

		// Two-Factor Authentication (TOTP)
		protected.POST("/auth/totp/setup", totpHandler.Setup)
		protected.POST("/auth/totp/enable", totpHandler.Enable)
		protected.POST("/auth/totp/disable", totpHandler.Disable)
		protected.GET("/auth/totp/status", totpHandler.Status)
		protected.POST("/auth/totp/backup-codes", totpHandler.RegenerateBackupCodes)
		protected.DELETE("/auth/totp/trusted-devices", totpHandler.RevokeTrustedDevices)

		// User routes (authenticated)
		protected.GET("/users/:id", userHandler.GetByID)

		// File uploads
		protected.POST("/uploads", uploadHandler.Create)
		protected.POST("/uploads/presign", uploadHandler.Presign)
		protected.POST("/uploads/complete", uploadHandler.CompleteUpload)
		protected.GET("/uploads", uploadHandler.List)
		protected.GET("/uploads/:id", uploadHandler.GetByID)
		protected.DELETE("/uploads/:id", uploadHandler.Delete)

		// AI
		protected.POST("/ai/complete", aiHandler.Complete)
		protected.POST("/ai/chat", aiHandler.Chat)
		protected.POST("/ai/stream", aiHandler.Stream)

		// Grit UI component registry (authenticated browse)
		protected.GET("/ui-components", uiRegistryHandler.ListComponents)
		protected.GET("/ui-components/:name", uiRegistryHandler.GetComponentDetail)

		protected.GET("/projects", projectHandler.List)
		protected.GET("/projects/:id", projectHandler.GetByID)
		protected.POST("/projects", projectHandler.Create)
		protected.PUT("/projects/:id", projectHandler.Update)
		protected.GET("/projects/:id/conversations", projectHandler.ListConversations)
		protected.PATCH("/projects/:id/metadata", projectHandler.UpdateMetadata)
		protected.GET("/conversations", conversationHandler.List)
		protected.GET("/conversations/:id", conversationHandler.GetByID)
		protected.POST("/conversations", conversationHandler.Create)
		protected.PUT("/conversations/:id", conversationHandler.Update)
		protected.GET("/project_phases", projectPhaseHandler.List)
		protected.GET("/project_phases/:id", projectPhaseHandler.GetByID)
		protected.POST("/project_phases", projectPhaseHandler.Create)
		protected.PUT("/project_phases/:id", projectPhaseHandler.Update)
		protected.GET("/credit_logs", creditLogHandler.List)
		protected.GET("/credit_logs/:id", creditLogHandler.GetByID)
		protected.POST("/credit_logs", creditLogHandler.Create)
		protected.PUT("/credit_logs/:id", creditLogHandler.Update)
		protected.GET("/deployments", deploymentHandler.List)
		protected.GET("/deployments/:id", deploymentHandler.GetByID)
		protected.POST("/deployments", deploymentHandler.Create)
		protected.PUT("/deployments/:id", deploymentHandler.Update)
		protected.GET("/subscriptions", subscriptionHandler.List)
		protected.GET("/subscriptions/:id", subscriptionHandler.GetByID)
		protected.POST("/subscriptions", subscriptionHandler.Create)
		protected.PUT("/subscriptions/:id", subscriptionHandler.Update)
		// Odeta billing routes
		protected.GET("/billing/plans", billingHandler.GetPlans)
		protected.POST("/billing/purchase", billingHandler.PurchaseCredits)
		protected.GET("/billing/check-payment", billingHandler.CheckPayment)
		protected.GET("/billing/subscription", billingHandler.GetSubscription)

		// Odeta credit routes
		protected.GET("/me/credits", creditsHandler.GetBalance)
		protected.POST("/me/credits/check", creditsHandler.CheckCredits)

		// Odeta AI chat (with credits + conversation persistence)
		protected.POST("/chat", odetaChatHandler.Chat)

		// Odeta project generation
		protected.POST("/generate", generateHandler.Generate)
		protected.GET("/projects/:id/progress", generateHandler.StreamProgress)

		// Odeta deployment
		protected.POST("/deploy", deployHandler.Deploy)
		protected.GET("/projects/:id/deployments", deployHandler.ListDeployments)
		protected.GET("/subdomains/check", deployHandler.CheckSubdomain)

		// File management
		protected.GET("/projects/:id/files", fileHandler.ListFiles)
		protected.GET("/projects/:id/files/content", fileHandler.GetFileContent)
		protected.PUT("/projects/:id/files/content", fileHandler.SaveFileContent)
		protected.DELETE("/projects/:id/files", fileHandler.DeleteFile)
		protected.GET("/projects/:id/download", fileHandler.DownloadProject)

		// GitHub integration
		protected.POST("/projects/:id/github/create", githubHandler.CreateAndPush)

		// Dev server management
		protected.GET("/projects/:id/server/status", devServerHandler.GetStatus)
		protected.POST("/projects/:id/server/start", devServerHandler.Start)
		protected.POST("/projects/:id/server/stop", devServerHandler.Stop)
		protected.POST("/projects/:id/server/restart", devServerHandler.Restart)
		protected.POST("/projects/:id/server/run", devServerHandler.RunCommand)
		protected.GET("/projects/:id/server/logs", devServerHandler.StreamLogs)

		// grit:routes:protected
	}

	// Profile routes (any authenticated user)
	profile := protected.Group("/profile")
	{
		profile.GET("", userHandler.GetProfile)
		profile.PUT("", userHandler.UpdateProfile)
		profile.DELETE("", userHandler.DeleteProfile)
	}

	// Admin routes
	admin := r.Group("/api")
	admin.Use(middleware.Auth(db, authService))
	admin.Use(middleware.RequireRole("ADMIN"))
	{
		admin.GET("/users", userHandler.List)
		admin.POST("/users", userHandler.Create)
		admin.PUT("/users/:id", userHandler.Update)
		admin.DELETE("/users/:id", userHandler.Delete)

		// Admin system routes
		admin.GET("/admin/jobs/stats", jobsHandler.Stats)
		admin.GET("/admin/jobs/:status", jobsHandler.ListByStatus)
		admin.POST("/admin/jobs/:id/retry", jobsHandler.Retry)
		admin.DELETE("/admin/jobs/queue/:queue", jobsHandler.ClearQueue)
		admin.GET("/admin/cron/tasks", cronHandler.ListTasks)

		// Blog management (admin)
		admin.GET("/admin/blogs", blogHandler.List)
		admin.POST("/admin/blogs", blogHandler.Create)
		admin.PUT("/admin/blogs/:id", blogHandler.Update)
		admin.DELETE("/admin/blogs/:id", blogHandler.Delete)

		// Grit UI component registry (admin management)
		admin.POST("/admin/ui-components", uiRegistryHandler.CreateComponent)
		admin.PUT("/admin/ui-components/:name", uiRegistryHandler.UpdateComponent)
		admin.DELETE("/admin/ui-components/:name", uiRegistryHandler.DeleteComponent)

		admin.DELETE("/projects/:id", projectHandler.Delete)
		admin.DELETE("/conversations/:id", conversationHandler.Delete)
		admin.DELETE("/project_phases/:id", projectPhaseHandler.Delete)
		admin.DELETE("/credit_logs/:id", creditLogHandler.Delete)
		admin.DELETE("/deployments/:id", deploymentHandler.Delete)
		admin.DELETE("/subscriptions/:id", subscriptionHandler.Delete)
		// Odeta admin routes
		admin.GET("/admin/stats", adminOdetaHandler.GetStats)
		admin.POST("/admin/users/:id/credits", adminOdetaHandler.AdjustCredits)
		admin.PUT("/admin/users/:id/plan", adminOdetaHandler.ChangePlan)
		admin.POST("/admin/users/:id/suspend", adminOdetaHandler.SuspendUser)

		// grit:routes:admin
	}

	// Webhook routes (public — signature-verified internally)
	webhookGroup := r.Group("/webhooks")
	{
		webhookGroup.POST("/stripe", stripeWebhook.Handle)
		webhookGroup.POST("/dgateway", dgatewayWebhook.Handle)
		webhookGroup.POST("/github", githubWebhook.Handle)
		webhookGroup.POST("/orbita", orbitaWebhook.Handle)
	}

	// Custom role-restricted routes
	// grit:routes:custom

	return r
}
