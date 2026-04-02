.PHONY: build build-web build-api dev clean sandbox-image

# Full production build — single binary with embedded SPA
build: build-web build-api

# Build Next.js static export
build-web:
	@echo "▶ Building Next.js static export..."
	cd apps/web && pnpm install && pnpm build
	@echo "▶ Copying static files into Go embed directory..."
	rm -rf apps/api/internal/web/dist
	mkdir -p apps/api/internal/web/dist
	cp -r apps/web/out/. apps/api/internal/web/dist/
	@echo "✓ Static files ready"

# Build Go binary with embedded static files
build-api:
	@echo "▶ Building Go binary..."
	cd apps/api && go build -o ../../odeta ./cmd/server
	@echo "✓ Binary ready: ./odeta"

# Build sandbox Docker image
sandbox-image:
	docker build -t odeta-sandbox -f apps/api/Dockerfile.sandbox .

# Development mode
dev:
	@echo "Run in separate terminals:"
	@echo "  Terminal 1: cd apps/api && air"
	@echo "  Terminal 2: cd apps/web && pnpm dev"

clean:
	rm -f ./odeta
	rm -rf apps/api/internal/web/dist
	rm -rf apps/web/out
	rm -rf apps/web/.next
