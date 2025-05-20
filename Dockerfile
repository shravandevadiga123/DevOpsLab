# Use official Node.js 18 LTS image
FROM node:18-alpine

# Set working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json (if exists)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the app source code (including public folder)
COPY . .

# Expose the port your app listens on (change if needed)
EXPOSE 5000

# Start the app
CMD ["node", "index.js"]
