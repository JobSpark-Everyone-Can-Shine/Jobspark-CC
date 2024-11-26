# Use official Node.js image as the base image
FROM node:18

# Create and set the working directory
WORKDIR /usr/src/app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the app
COPY . .

# Expose the port that the app will run on
EXPOSE 3000

# Command to start the app
CMD [ "npm", "start" ]