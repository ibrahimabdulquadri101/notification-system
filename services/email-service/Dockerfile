FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Install only production dependencies
RUN npm ci --omit=dev

# Expose port
EXPOSE 3001

# Start in production mode
CMD ["node", "dist/main"]
