# Build stage
FROM node:20-alpine AS build

WORKDIR /app

# Build arguments for environment variables
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the app
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy nginx config template
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

# Copy built assets from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Default port (Railway will override via $PORT)
ENV PORT=80

# Expose port
EXPOSE $PORT

# nginx:alpine image automatically runs envsubst on templates in /etc/nginx/templates/
# and outputs to /etc/nginx/conf.d/, then starts nginx
