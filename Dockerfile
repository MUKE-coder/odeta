# Stage 1: Build Next.js static export
FROM node:20-slim AS web-builder
RUN npm install -g pnpm@9
WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/web ./apps/web
COPY packages ./packages
RUN pnpm install --frozen-lockfile
RUN cd apps/web && NODE_ENV=production pnpm build

# Stage 2: Build Go binary with embedded static files
FROM golang:1.24-alpine AS go-builder
WORKDIR /app
COPY apps/api ./apps/api
COPY COMPONENT_REGISTRY.md ./
# Copy Next.js static output into Go embed directory
COPY --from=web-builder /app/apps/web/out ./apps/api/internal/web/dist
RUN cd apps/api && CGO_ENABLED=0 GOOS=linux go build -o /odeta ./cmd/server

# Stage 3: Minimal runtime
FROM alpine:3.20
RUN apk add --no-cache ca-certificates docker-cli
COPY --from=go-builder /odeta /odeta
COPY COMPONENT_REGISTRY.md /COMPONENT_REGISTRY.md
EXPOSE 8080
CMD ["/odeta"]
