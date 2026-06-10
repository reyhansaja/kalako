# Step 1: Build stage
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Step 2: Serve stage
FROM nginx:stable-alpine

ENV PORT 8080

# Hapus default config nginx
RUN rm /etc/nginx/conf.d/default.conf

# Pakai nginx.conf kita sendiri
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy hasil build
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8080

CMD ["/bin/sh", "-c", "envsubst '${PORT}' < /etc/nginx/conf.d/default.conf > /tmp/nginx.conf && cp /tmp/nginx.conf /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]