FROM node:20-alpine AS build-stage

ARG CONFIG_ENV=production

WORKDIR /app

RUN apk add --no-cache curl && \
    curl -Lo /usr/bin/yq https://github.com/mikefarah/yq/releases/latest/download/yq_linux_amd64 && \
    chmod +x /usr/bin/yq

COPY . ./

# Function to convert a YAML section to .env
# This reads a section from config.yaml and outputs key-value pairs as VAR=VALUE
RUN yq ".${CONFIG_ENV} | to_entries | .[] | \"\(.key)=\(.value)\"" /app/config.yaml > .env

RUN npm install

RUN npm run build

# Serve with nginx
FROM nginx:alpine AS production-stage

COPY --from=build-stage /app/dist /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
