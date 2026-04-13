# Stage 1: Build React app
FROM node:20-alpine AS build
WORKDIR /app

# Copy package files trước (layer caching)
COPY package*.json ./
RUN npm ci

# Nhận API URL lúc build
ARG VITE_API_BASE_URL=http://localhost:8080/api
ARG VITE_WS_URL=http://localhost:8080
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_WS_URL=$VITE_WS_URL

COPY . .
RUN npm run build

# Stage 2: Serve bằng Nginx (chỉ ~20MB)
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
