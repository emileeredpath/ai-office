FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY backend/package*.json ./

# Install dependencies
RUN npm ci

# Copy source
COPY backend/src ./src
COPY backend/tsconfig.json ./

# Run migrations and seed on startup
CMD npm run migrate && npm run seed && npm run dev
