# Step 1: Build stage
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy the rest of the source code
COPY . .

# Build the project
RUN npm run build

# Step 2: Serve stage
FROM nginx:stable-alpine

# Copy the custom Nginx template and configure PORT environment variable substitution
COPY nginx.conf /etc/nginx/templates/default.conf.template

# Restrict envsubst to only replace the PORT variable (leaving Nginx variables like $uri untouched)
ENV NGINX_ENVSUBST_FILTER PORT

# Set default port to 8080 (standard for Cloud Run, but can be overridden)
ENV PORT 8080

# Copy the build output from the build stage to Nginx html directory
COPY --from=build /app/dist /usr/share/nginx/html

# Expose port 8080
EXPOSE 8080

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]