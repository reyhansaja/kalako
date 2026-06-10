# Step 1: Build stage
FROM node:20-alpine AS build
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
# Mengubah 'npm ci' menjadi 'npm install --omit=dev' atau 'npm install' biasa agar lebih aman
RUN npm install

# Copy the rest of the source code
COPY . .

# Build the project
RUN npm run build

# Step 2: Serve stage
FROM nginx:stable-alpine

# Mengubah port default internal Nginx dari 80 ke 8080 agar sesuai dengan Cloud Run
RUN sed -i 's/listen[:[:space:]]*80;/listen 8080;/g' /etc/nginx/conf.d/default.conf

# Set default port environment variable untuk Cloud Run
ENV PORT 8080

# Copy hasil build output (folder dist) dari build stage ke direktori html Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Expose port 8080
EXPOSE 8080

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]