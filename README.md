# Fucsol API - Backend Service

![CI Status](https://github.com/BosatzuKannon/fucsol-backend/actions/workflows/ci.yml/badge.svg)
![NestJS](https://img.shields.io/badge/nestjs-%23E0234E.svg?style=for-the-badge&logo=nestjs&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white)

## Description

Monolithic backend service for Fucsol, an e-commerce platform focused on natural products. Built with NestJS and fully containerized with Docker, integrating Supabase for database management and authentication.

## Tech Stack

* **Framework:** NestJS (TypeScript)
* **Database & Auth:** Supabase (PostgreSQL)
* **Infrastructure:** Docker & GitHub Actions
* **Package Manager:** npm

## Installation

\`\`\`bash
$ npm install
\`\`\`

## Running the app (Local)

\`\`\`bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
\`\`\`

## 🐳 Docker Setup

The application is fully containerized using a **multi-stage build** strategy to ensure a lightweight and secure production image.

\`\`\`bash
# 1. Build the Docker image
$ docker build -t fucsol-backend .

# 2. Run the container (mapped to port 3000)
$ docker run -p 3000:3000 fucsol-backend
\`\`\`

## 🚀 CI/CD Pipeline

This repository utilizes **GitHub Actions** for Continuous Integration to ensure code quality and build stability.

* **Triggers:**
    * Push events to feature branches.
    * Pull Requests targeting the \`main\` branch.
* **Automated Checks:**
    * Linting validation (ESLint).
    * Unit Tests execution.
    * Docker Build validation (ensures the image compiles correctly).

## Author

* **Carlos Julio Jaramillo Corrales**
* Email: carlos87jaramillo@gmail.com