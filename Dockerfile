# ==========================================
# Multi-Stage Dockerfile for Vanguard Ops
# Disaster Relief Management Platform
# ==========================================

# Stage 1: Build the React + Vite Frontend
FROM node:22-alpine AS client-builder
WORKDIR /app/client

# Install client dependencies
COPY client/package*.json ./
RUN npm ci

# Copy client source code and build
COPY client/ ./
RUN npm run build

# Stage 2: Production Server Runner
FROM node:22-alpine AS production
WORKDIR /app

# Install server dependencies
COPY server/package*.json ./server/
WORKDIR /app/server
RUN npm ci --only=production

# Copy server code
WORKDIR /app
COPY server/ ./server/

# Copy compiled frontend from Stage 1 into client/dist for Express static serving
COPY --from=client-builder /app/client/dist ./client/dist

# Create persistent database directory
RUN mkdir -p /app/data \
  && chown -R node:node /app \
  && chgrp -R 0 /app/data \
  && chmod -R g=u /app/data

# Set production environment variables
ENV NODE_ENV=production
ENV PORT=5000
ENV DATA_DIR=/app/data

# Switch to non-root user
USER node

# Expose HTTP port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/health || exit 1

# Start the full-stack server
WORKDIR /app/server
CMD ["node", "index.js"]
