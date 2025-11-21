FROM node:18-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
 
FROM base AS build
WORKDIR /
COPY . .
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
ENV NODE_ENV=production
RUN pnpm run build
 
FROM base AS dokploy
WORKDIR /
ENV NODE_ENV=production
 
# Copy only the necessary files
COPY --from=build /dist ./dist
COPY --from=build /package.json ./package.json
COPY --from=build /node_modules ./node_modules
 
EXPOSE 3000
CMD ["pnpm", "start"]
