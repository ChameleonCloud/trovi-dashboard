# Stage 1: Build the Vue.js app with Vite
FROM node:18-alpine AS build-stage

# Set the working directory
WORKDIR /app

# Copy the package.json and package-lock.json
COPY . ./

# Install dependencies
RUN npm install

# Build the app for production
RUN npm run build

# Stage 2: Serve the app with Nginx
FROM nginx:alpine AS production-stage

# Copy the built files from the previous stage
COPY --from=build-stage /app/dist /usr/share/nginx/html

# Copy the custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
