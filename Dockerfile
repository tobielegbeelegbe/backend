# syntax=docker/dockerfile:1.4

# Stage 1: Build dependencies and application
FROM node:lts-alpine AS build

# Enable Corepack and configure pnpm
RUN corepack enable
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

WORKDIR /app

RUN npm install

# Copy lockfile and fetch dependencies
COPY pnpm-lock.yaml ./
RUN --mount=type=cache,target=/pnpm/store \
    pnpm fetch

# Copy package.json and install dependencies
COPY package.json ./
RUN --mount=type=cache,target=/pnpm/store \
    pnpm install --frozen-lockfile --prod --offline

# Copy the rest of the application code
COPY . .

# Build the application (if applicable, e.g., for a Next.js or React app)
# RUN pnpm build

# Stage 2: Runtime image
FROM node:lts-alpine AS runtime

# Create a non-root user for security
RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser
WORKDIR /app

# Copy built application from the build stage
COPY --from=build --chown=appuser:appgroup /app ./

# Set environment variables
ENV NODE_ENV=production

# Switch to the non-root user
USER appuser

# Expose the application port
EXPOSE 3000

# Define the command to run the application
CMD ["node", "server.js"] # Adjust "src/index.js" to your application's entry point
