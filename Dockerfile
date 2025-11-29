# Stage 1: Build the application
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --only=production

COPY . .

RUN npm run build # If you have a build step (e.g., TypeScript compilation, Webpack)

# Stage 2: Create the final production image
FROM node:20-alpine AS production

WORKDIR /app

# Copy only necessary files from the builder stage
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json # Only if needed for runtime (e.g., scripts)
COPY --from=builder /app/dist ./dist # Assuming your build output is in 'dist'

ENV NODE_ENV=production

EXPOSE 3000 # Or the port your Node.js application listens on

CMD ["node", "dist/server.js"] # Adjust to your main application entry point (e.g., app.js, index.js)
