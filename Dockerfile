FROM node:18-alpine

WORKDIR /app

COPY . .

RUN cd frontend && npm install --legacy-peer-deps && npm run build

RUN cd backend && npm install --omit=dev

ENV PORT=3000

EXPOSE 3000

CMD ["node", "backend/server.js"]
