FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production && npm cache clean --force

COPY . .

RUN mkdir -p /app/data && \
    chown -R node:node /app/data

EXPOSE 8083

ENV NODE_ENV=production
ENV PORT=8083

USER node

CMD ["node", "src/server.js"]
