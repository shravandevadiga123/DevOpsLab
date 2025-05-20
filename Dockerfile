# Use official Node.js 18 LTS image (Alpine = small, secure)
FROM node:18-alpine

# Set working directory inside the container
WORKDIR /app

# Copy only package files to install dependencies (this helps Docker cache layer)
COPY package*.json ./

# Install dependencies
RUN npm ci --omit=dev

# Copy rest of the application
COPY . .

# Expose the app port (if your app uses 5000)
EXPOSE 5000

# Run the app
CMD ["node", "index.js"]
