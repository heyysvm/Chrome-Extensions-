# Stage 1: Build client static files
FROM node:20-alpine AS build

WORKDIR /app

# Copy root configurations for monorepo workspaces
COPY package*.json ./
COPY client/package*.json ./client/
COPY shared/package*.json ./shared/

# Install workspace dependencies
RUN npm ci --workspace=client

# Copy rest of the files
COPY . .

# Compile static bundles
RUN npm run build --workspace=client

# Stage 2: Serve compiled files using Nginx
FROM nginx:alpine

# Copy custom Nginx configuration to support SPA routing
COPY <<EOF /etc/nginx/conf.d/default.conf
server {
    listen 80;
    server_name localhost;

    location / {
        root /usr/share/nginx/html;
        index index.html index.htm;
        try_files \$uri \$uri/ /index.html;
    }

    error_page 500 502 503 504 /50x.html;
    location = /50x.html {
        root /usr/share/nginx/html;
    }
}
EOF

# Copy compiled files from stage 1
COPY --from=build /app/client/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
