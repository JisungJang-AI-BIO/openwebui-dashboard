FROM node:20-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

RUN adduser --disabled-password --gecos "" appuser

COPY . .
RUN chown -R appuser:appuser /app

USER appuser

CMD ["npm", "run", "dev", "--", "--host"]
