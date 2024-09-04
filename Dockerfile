FROM oven/bun:latest

WORKDIR /app

COPY package.json .
COPY bun.lockb .
COPY .env.example .env

RUN bun install

COPY . .

RUN mkdir -p /app/image

EXPOSE 9000

CMD ["bun", "start"]