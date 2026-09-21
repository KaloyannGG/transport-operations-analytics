# Transport Operations Analytics

This is a small full-stack project I built to practice JavaScript, SQL, PostgreSQL and working with external APIs.

The idea is a simple internal tool for a transport company. It keeps information about drivers, vehicles and trips, calculates route distance and fuel costs, and shows basic performance data.

## Features

- Add and manage drivers
- Add and manage vehicles
- Create transport trips
- Automatic route distance and travel time calculation
- Automatic fuel usage and fuel cost calculation
- Revenue, costs and profit tracking
- Planned, Completed and Cancelled trip statuses
- Driver and vehicle performance overview
- PostgreSQL database storage

The financial dashboard includes completed trips only.

## Technologies

- JavaScript
- Node.js
- Express.js
- PostgreSQL
- SQL
- HTML
- CSS
- REST APIs
- Open-Meteo Geocoding API
- openrouteservice API

## How it works

When a trip is added, the app gets the coordinates for the origin and destination using Open-Meteo.

The coordinates are sent to openrouteservice to get the route distance and estimated travel time.

The app then reads the selected vehicle's average fuel consumption from PostgreSQL and calculates the estimated fuel cost based on the distance and fuel price.

The trip is saved in PostgreSQL and the dashboard is updated with the new data.

## Screenshots

### Dashboard

![Dashboard](screenshots/dashboard.png)

### Performance and trips

![Analytics](screenshots/analytics.png)

## Database

The project uses three main tables:

- `drivers`
- `vehicles`
- `trips`

Trips are linked to drivers and vehicles using foreign keys.

## Main API routes

```text
GET  /api/drivers
POST /api/drivers

GET  /api/vehicles
POST /api/vehicles

GET    /api/trips
POST   /api/trips
PATCH  /api/trips/:id/status
DELETE /api/trips/:id

GET /api/analytics/summary
GET /api/analytics/drivers
GET /api/analytics/vehicles
```

## Setup

Install dependencies:

```bash
npm install
```

Create a PostgreSQL database named:

```text
transport_operations
```

Run the database schema:

```bash
psql -U postgres -d transport_operations -f sql/schema.sql
```

Create a `.env` file using `.env.example` and add your PostgreSQL password and openrouteservice API key.

Start the application:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

## Why I built it

I wanted to build something where I could combine JavaScript with SQL, PostgreSQL and API integration instead of making another basic frontend project.

The transport use case gave me useful data to work with such as routes, mileage, fuel consumption, costs, revenue and profit.