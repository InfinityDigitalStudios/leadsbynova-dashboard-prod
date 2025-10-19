# Use Node 18 as the base
FROM node:18-alpine

WORKDIR /usr/src/app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the app
COPY . .

# Build the Vite app (adjust if you use Next.js or another builder)
RUN npm run build

# Serve the built files using a lightweight HTTP server
RUN npm install -g serve
EXPOSE 80
CMD ["serve", "-s", "dist", "-l", "80"]
