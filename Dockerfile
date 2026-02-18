# --- Stage 1: Build ---
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /usr/src/app

# Copy package manifests
COPY package*.json ./

# Install ALL dependencies (including devDependencies for building)
RUN npm ci

# Copy the rest of the application source code
COPY . .

# Build the application (compiles TypeScript to JavaScript in /dist)
RUN npm run build

# --- Stage 2: Production ---
FROM node:20-alpine AS production

# Set environment variable to production
ENV NODE_ENV=production

WORKDIR /usr/src/app

# Copy package manifests from the builder stage
COPY --from=builder /usr/src/app/package*.json ./

# Install ONLY production dependencies
RUN npm ci --omit=dev

# Copy the compiled application from the builder stage
COPY --from=builder /usr/src/app/dist ./dist

# Expose the default NestJS port
EXPOSE 3000

# Start the application
CMD ["node", "dist/main"]