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

# Copy nginx config template (not to templates dir to avoid envsubst issues)
COPY nginx.conf.template /etc/nginx/conf.d/default.conf

# Copy startup script
COPY start.sh /start.sh
RUN chmod +x /start.sh

# Copy built assets from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Default port (Railway will override via $PORT)
ENV PORT=80

# Expose port
EXPOSE 80

# Start with custom script
CMD ["/start.sh"]
