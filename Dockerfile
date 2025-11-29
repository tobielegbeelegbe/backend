FROM node:18-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
# Use a lightweight Node.js base image
FROM node:20-alpine

FROM base AS build
WORKDIR /
COPY . .
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
ENV NODE_ENV=production
RUN pnpm run build
# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json (if present) to leverage Docker's caching
COPY package*.json ./

FROM base AS dokploy
WORKDIR /
ENV NODE_ENV=production
# Install application dependencies
RUN pnpm install

# Copy only the necessary files
COPY --from=build /dist ./dist
COPY --from=build /package.json ./package.json
COPY --from=build /node_modules ./node_modules
# Copy the rest of the application code
COPY . .

# Expose the port your Node.js application listens on
EXPOSE 3000
CMD ["pnpm", "start"]

# Command to run the application
CMD [ "node --async-stack-traces", "server.js" ]
