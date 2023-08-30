# syntax=docker/dockerfile:1

FROM node:alpine
ARG TARGETPLATFORM
ARG BUILDPLATFORM
RUN echo "I am running on $BUILDPLATFORM, building for $TARGETPLATFORM"
LABEL maintainer="Ryan Jacobs ryan@ryanjjacobs.com"
RUN mkdir -p /app
WORKDIR /app
COPY . /app
RUN npm install
ENV PORT 3000
EXPOSE 3000
CMD ["node", "./bin/www"]