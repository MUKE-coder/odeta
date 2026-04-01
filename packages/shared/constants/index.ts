export const ROLES = {
  ADMIN: "ADMIN",
  EDITOR: "EDITOR",
  USER: "USER",
  // grit:role-constants
} as const;

export const API_ROUTES = {
  AUTH: {
    LOGIN: "/api/auth/login",
    REGISTER: "/api/auth/register",
    REFRESH: "/api/auth/refresh",
    LOGOUT: "/api/auth/logout",
    ME: "/api/auth/me",
    FORGOT_PASSWORD: "/api/auth/forgot-password",
    RESET_PASSWORD: "/api/auth/reset-password",
    OAUTH: {
      GOOGLE: "/api/auth/oauth/google",
      GITHUB: "/api/auth/oauth/github",
    },
  },
  USERS: {
    LIST: "/api/users",
    GET: (id: number) => `/api/users/${id}`,
    UPDATE: (id: number) => `/api/users/${id}`,
    DELETE: (id: number) => `/api/users/${id}`,
  },
  UPLOADS: {
    CREATE: "/api/uploads",
    LIST: "/api/uploads",
    GET: (id: number) => `/api/uploads/${id}`,
    DELETE: (id: number) => `/api/uploads/${id}`,
  },
  AI: {
    COMPLETE: "/api/ai/complete",
    CHAT: "/api/ai/chat",
    STREAM: "/api/ai/stream",
  },
  ADMIN: {
    JOBS_STATS: "/api/admin/jobs/stats",
    JOBS_LIST: (status: string) => `/api/admin/jobs/${status}`,
    JOBS_RETRY: (id: string) => `/api/admin/jobs/${id}/retry`,
    JOBS_CLEAR: (queue: string) => `/api/admin/jobs/queue/${queue}`,
    CRON_TASKS: "/api/admin/cron/tasks",
  },
  PROFILE: {
    GET: "/api/profile",
    UPDATE: "/api/profile",
    DELETE: "/api/profile",
  },
  BLOGS: {
    LIST: "/api/blogs",
    GET: (slug: string) => `/api/blogs/${slug}`,
    ADMIN_LIST: "/api/admin/blogs",
    CREATE: "/api/admin/blogs",
    UPDATE: (id: number) => `/api/admin/blogs/${id}`,
    DELETE: (id: number) => `/api/admin/blogs/${id}`,
  },
  HEALTH: "/api/health",
  PROJECTS: {
    LIST: "/api/projects",
    GET: (id: number) => `/api/projects/${id}`,
    CREATE: "/api/projects",
    UPDATE: (id: number) => `/api/projects/${id}`,
    DELETE: (id: number) => `/api/projects/${id}`,
  },
  CONVERSATIONS: {
    LIST: "/api/conversations",
    GET: (id: number) => `/api/conversations/${id}`,
    CREATE: "/api/conversations",
    UPDATE: (id: number) => `/api/conversations/${id}`,
    DELETE: (id: number) => `/api/conversations/${id}`,
  },
  PROJECT_PHASES: {
    LIST: "/api/project_phases",
    GET: (id: number) => `/api/project_phases/${id}`,
    CREATE: "/api/project_phases",
    UPDATE: (id: number) => `/api/project_phases/${id}`,
    DELETE: (id: number) => `/api/project_phases/${id}`,
  },
  CREDIT_LOGS: {
    LIST: "/api/credit_logs",
    GET: (id: number) => `/api/credit_logs/${id}`,
    CREATE: "/api/credit_logs",
    UPDATE: (id: number) => `/api/credit_logs/${id}`,
    DELETE: (id: number) => `/api/credit_logs/${id}`,
  },
  DEPLOYMENTS: {
    LIST: "/api/deployments",
    GET: (id: number) => `/api/deployments/${id}`,
    CREATE: "/api/deployments",
    UPDATE: (id: number) => `/api/deployments/${id}`,
    DELETE: (id: number) => `/api/deployments/${id}`,
  },
  SUBSCRIPTIONS: {
    LIST: "/api/subscriptions",
    GET: (id: number) => `/api/subscriptions/${id}`,
    CREATE: "/api/subscriptions",
    UPDATE: (id: number) => `/api/subscriptions/${id}`,
    DELETE: (id: number) => `/api/subscriptions/${id}`,
  },
  // grit:api-routes
} as const;
