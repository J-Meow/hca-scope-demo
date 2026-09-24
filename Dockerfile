FROM denoland/deno:latest

WORKDIR /app

COPY . .

CMD ["deno", "run", "--allow-net", "--allow-env", "main.ts"]

