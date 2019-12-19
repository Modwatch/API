FROM node:12-alpine as builder

WORKDIR /app

COPY package.json package-lock.json tsconfig.json /app/
RUN npm ci

COPY lib/ /app/lib/
RUN mkdir -p dist/server && npm run build

FROM node:12-alpine as runner

WORKDIR /app

COPY package.json package-lock.json /app/
RUN npm ci --only=production
COPY server.js /app/
COPY --from=builder /app/dist /app/dist

CMD node -r dotenv/config /app/server.js
