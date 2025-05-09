# Stage 1: Build React frontend
FROM node:18-alpine AS build-frontend

WORKDIR /app/frontend

# Copy package.json and package-lock.json (or yarn.lock)
COPY package*.json ./
# If you use yarn, uncomment the next two lines and comment out the npm install line
# COPY yarn.lock ./
# RUN yarn install --frozen-lockfile

RUN npm install

# Copy the rest of frontend application files
COPY public ./public
COPY src ./src

# Build the React application
RUN npm run build

# Stage 2: Setup Python FastAPI backend
FROM python:3.9-slim AS backend

WORKDIR /app

# Install system dependencies that might be needed by Python packages
# RUN apt-get update && apt-get install -y --no-install-recommends \
#     # Add any system dependencies here, e.g., build-essential, libpq-dev
#     && rm -rf /var/lib/apt/lists/*

# Copy backend requirements file
COPY server/requirements.txt ./server/requirements.txt

# Install Python dependencies
RUN pip install --no-cache-dir -r ./server/requirements.txt

# Copy backend application code
COPY ./server ./server

# Copy built frontend static files from the build-frontend stage
COPY --from=build-frontend /app/frontend/build ./server/static

# Expose the port the app runs on
EXPOSE 4000

# Command to run the application
# Ensure your FastAPI application is in server/main.py and the app instance is named 'app'
# Also ensure your FastAPI app is configured to serve static files from './static'
# Example for main.py:
# from fastapi.staticfiles import StaticFiles
# app.mount("/static", StaticFiles(directory="static"), name="static")
# app.mount("/", StaticFiles(directory="static", html=True), name="root")
CMD ["uvicorn", "server.main:app", "--host", "0.0.0.0", "--port", "4000"]