FROM oven/bun:1.1.43

WORKDIR /app

# Update repositories and install libssl-dev
RUN echo "deb http://deb.debian.org/debian bullseye main" > /etc/apt/sources.list && \
  echo "deb http://deb.debian.org/debian-security bullseye-security main" >> /etc/apt/sources.list && \
  apt-get update -y && \
  apt-get install -y libssl-dev && \
  rm -rf /var/lib/apt/lists/*

# Copy package files first for caching
COPY package.json bun.lockb ./
RUN bun install

# Copy the rest of the app
COPY . .

# Generate Prisma client
RUN bunx prisma generate

# Start the app
CMD ["bun", "run", "src/index.ts"]