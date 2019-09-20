FROM node:11-alpine
LABEL maintainer="Ryan Jacobs ryan@ryanjjacobs.com"
RUN mkdir -p /app
WORKDIR /app
COPY . /app
RUN npm install
EXPOSE 3000
CMD ["npm", "run", "start"]