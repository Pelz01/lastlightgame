FROM node:24-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY server.mjs ./
COPY game ./game
COPY dist/client ./client
COPY dist/assets ./design/runtime
ENV HOST=0.0.0.0 PORT=4173
VOLUME ["/app/data"]
EXPOSE 4173
CMD ["node", "server.mjs"]
