# syntax=docker/dockerfile:1.22

FROM node:24.14.0-alpine AS build

ARG GIT_SHA=missingGitSha
ARG GIT_REF=container
ARG RELEASE_VERSION=0.3.0

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev && npm cache clean --force

COPY bin ./bin
COPY components ./components
COPY public ./public
COPY routes ./routes
COPY views ./views

FROM gcr.io/distroless/nodejs24-debian12:nonroot

WORKDIR /app

COPY --from=build /app /app

ENV NODE_ENV=production
ENV PORT=3000
ENV GIT_SHA=${GIT_SHA}
ENV GIT_REF=${GIT_REF}
ENV RELEASE_VERSION=${RELEASE_VERSION}

EXPOSE 3000

CMD ["./bin/www"]