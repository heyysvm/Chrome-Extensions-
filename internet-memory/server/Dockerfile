FROM node:20-alpine

WORKDIR /app

# Copy root configurations for monorepo workspaces
COPY package*.json ./
COPY server/package*.json ./server/
COPY shared/package*.json ./shared/

# Install workspace dependencies
RUN npm ci --workspace=server

# Copy rest of the files
COPY . .

# Compile TypeScript
RUN npm run build --workspace=server

EXPOSE 5000

ENV PORT=5000
ENV NODE_ENV=production

CMD ["npm", "start", "--workspace=server"]
