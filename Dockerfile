FROM node:22-alpine AS build

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine

WORKDIR /app
ARG APP_VERSION=""
ARG APP_COMMIT_MESSAGE=""
ARG APP_COMMIT_DATE=""
ARG APP_REPOSITORY=""
ARG APP_BRANCH="main"
ENV NODE_ENV=production
ENV PORT=1314
ENV DATA_DIR=/app/data
ENV APP_VERSION=$APP_VERSION
ENV APP_COMMIT_MESSAGE=$APP_COMMIT_MESSAGE
ENV APP_COMMIT_DATE=$APP_COMMIT_DATE
ENV APP_REPOSITORY=$APP_REPOSITORY
ENV APP_BRANCH=$APP_BRANCH

COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
COPY server ./server

EXPOSE 1314

CMD ["node", "server/index.js"]
