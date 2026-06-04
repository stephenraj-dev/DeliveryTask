# Mini Logistics Platform

A full-stack logistics platform built with NestJS, React, MongoDB, and Redis.

## Prerequisites
- Docker and Docker Compose
- Node.js (v20+)

## Running the Application (Docker)
This project uses Docker Compose to spin up all the required services.

1. Navigate to the project root:
   ```bash
   cd d:\\DeliveryTask
   ```
2. Start the services:
   ```bash
   docker-compose up --build
   ```
   *Note: This will start MongoDB, Redis, the NestJS Backend on port 3001, and the React Frontend on port 3000.*

## Running the Automated Testcase
We have provided an automated E2E test script (`testcase.js`) that simulates a full scenario: registering users, a rider coming online, a client creating an order, a rider picking it up and delivering it, and the admin checking analytics.

To run the test case:
1. Ensure the backend is running via Docker Compose (`docker-compose up`).
2. Open a new terminal.
3. Install axios (if not globally available) and run the script:
   ```bash
   cd d:\\DeliveryTask
   npm install axios
   node testcase.js
   ```

## API Endpoints Overview
- \`POST /auth/register\` - Register a new user (admin, client, rider)
- \`POST /auth/login\` - Login and receive JWT token
- \`POST /orders\` - Create a new order (assigns an available rider automatically)
- \`GET /orders\` - Get all orders (Admin only)
- \`GET /orders/my\` - Get orders for the logged-in client
- \`PATCH /orders/:id/status\` - Update the status of an order
- \`GET /riders\` - Get all riders
- \`PATCH /riders/:id/status\` - Mark rider as available or offline
- \`PATCH /riders/location\` - Update rider location (Simulates Redis caching + Socket events)
- \`GET /analytics/summary\` - Get platform statistics
