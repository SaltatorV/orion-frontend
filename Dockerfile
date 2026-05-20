FROM node:22 AS build

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .
RUN chmod +x ./node_modules/.bin/ng
RUN npm run build


FROM nginx:stable-alpine

COPY --from=build /app/dist/orion-frontend/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
