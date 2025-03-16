FROM oven/bun:1.1.43

WORKDIR /app

# Install OpenSSL 3.0.x (libssl-dev includes libssl.so.3 on Debian)
RUN apt-get update && apt-get install -y libssl-dev && rm -rf /var/lib/apt/lists/*

# Copy package files first for caching
COPY package.json bun.lockb ./
RUN bun install

# Copy the rest of the app
COPY . .

# Generate Prisma client
RUN bunx prisma generate

# Start the app (replace 'src/index.ts' with your actual entry point)
CMD ["bun", "run", "src/index.ts"]