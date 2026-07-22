FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source
COPY src ./src
COPY public ./public
COPY index.html vite.config.ts tsconfig.json tailwind.config.ts ./

# Expose port
EXPOSE 5173

# Run dev server
CMD npm run dev -- --host
