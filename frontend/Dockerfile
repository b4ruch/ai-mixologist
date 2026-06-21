# Step 1: Build the Vite/React app
# Vite 8 prefers Node 20.19+ or 22.12+. We will use node 22 to guarantee stability
FROM node:22-slim AS build

WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json* ./
RUN npm install

# Copy the rest of the frontend source code
COPY . .

# Build the project for production
RUN npm run build

# Step 2: Serve using Nginx
FROM nginx:alpine

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy the built Vite assets from the previous stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy our custom Nginx configuration mapping to Cloud Run's port schema
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port (Cloud Run sets PORT, our custom nginx uses 8080 default fallback)
EXPOSE 8080

# Start Nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
