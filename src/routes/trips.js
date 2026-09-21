const express = require("express");
const pool = require("../db/database");
const getCoordinates = require("../services/geocoding");
const getRoute = require("../services/routing");

const router = express.Router();


// get all trips
router.get("/", async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                trips.id,
                trips.origin,
                trips.destination,
                trips.trip_date,
                trips.distance_km,
                trips.duration_minutes,
                trips.revenue,
                trips.fuel_cost,
                trips.other_costs,
                trips.status,

                (
                    trips.revenue
                    - trips.fuel_cost
                    - trips.other_costs
                ) AS profit,

                drivers.first_name,
                drivers.last_name,

                vehicles.registration_number,
                vehicles.make,
                vehicles.model

            FROM trips

            JOIN drivers
                ON trips.driver_id = drivers.id

            JOIN vehicles
                ON trips.vehicle_id = vehicles.id

            ORDER BY trips.id DESC
        `);

        res.json(result.rows);

    } catch (error) {
        console.log(error);

        res.status(500).json({
            error: "Could not load trips"
        });
    }
});


// add new trip
router.post("/", async (req, res) => {
    try {
        const {
            driver_id,
            vehicle_id,
            origin,
            destination,
            trip_date,
            revenue,
            fuel_price,
            other_costs,
            status
        } = req.body;


        const driverId = Number(driver_id);
        const vehicleId = Number(vehicle_id);

        const revenueNumber = Number(revenue);
        const fuelPriceNumber = Number(fuel_price);
        const otherCostsNumber = Number(other_costs || 0);

        const allowedStatuses = [
            "planned",
            "completed",
            "cancelled"
        ];

        const tripStatus =
            status || "planned";


        if (
            !Number.isInteger(driverId) ||
            driverId <= 0 ||
            !Number.isInteger(vehicleId) ||
            vehicleId <= 0
        ) {
            return res.status(400).json({
                error: "Invalid driver or vehicle"
            });
        }


        if (
            typeof origin !== "string" ||
            origin.trim() === "" ||
            typeof destination !== "string" ||
            destination.trim() === "" ||
            !trip_date
        ) {
            return res.status(400).json({
                error: "Origin, destination and date are required"
            });
        }


        if (
            !Number.isFinite(revenueNumber) ||
            revenueNumber <= 0
        ) {
            return res.status(400).json({
                error: "Revenue must be greater than 0"
            });
        }


        if (
            !Number.isFinite(fuelPriceNumber) ||
            fuelPriceNumber <= 0
        ) {
            return res.status(400).json({
                error: "Fuel price must be greater than 0"
            });
        }


        if (
            !Number.isFinite(otherCostsNumber) ||
            otherCostsNumber < 0
        ) {
            return res.status(400).json({
                error: "Other costs cannot be negative"
            });
        }


        if (!allowedStatuses.includes(tripStatus)) {
            return res.status(400).json({
                error: "Invalid trip status"
            });
        }


        // check driver
        const driverResult = await pool.query(
            `
            SELECT id
            FROM drivers
            WHERE id = $1
            `,
            [driverId]
        );

        if (driverResult.rows.length === 0) {
            return res.status(404).json({
                error: "Driver not found"
            });
        }


        // get vehicle fuel consumption
        const vehicleResult = await pool.query(
            `
            SELECT average_consumption
            FROM vehicles
            WHERE id = $1
            `,
            [vehicleId]
        );

        if (vehicleResult.rows.length === 0) {
            return res.status(404).json({
                error: "Vehicle not found"
            });
        }


        const averageConsumption =
            Number(
                vehicleResult.rows[0]
                    .average_consumption
            );


        if (
            !Number.isFinite(averageConsumption) ||
            averageConsumption <= 0
        ) {
            return res.status(400).json({
                error: "Vehicle has invalid fuel consumption"
            });
        }


        // external APIs
        const cleanOrigin =
            origin.trim();

        const cleanDestination =
            destination.trim();

        const start =
            await getCoordinates(cleanOrigin);

        const end =
            await getCoordinates(cleanDestination);

        const route =
            await getRoute(start, end);


        // fuel calculation
        const fuelUsed =
            (
                route.distance_km
                * averageConsumption
            ) / 100;

        const fuelCost =
            fuelUsed * fuelPriceNumber;

        const calculatedFuelCost =
            Number(
                fuelCost.toFixed(2)
            );


        const result = await pool.query(
            `
            INSERT INTO trips (
                driver_id,
                vehicle_id,
                origin,
                destination,
                trip_date,
                distance_km,
                duration_minutes,
                revenue,
                fuel_cost,
                other_costs,
                status
            )
            VALUES (
                $1,
                $2,
                $3,
                $4,
                $5,
                $6,
                $7,
                $8,
                $9,
                $10,
                $11
            )
            RETURNING *
            `,
            [
                driverId,
                vehicleId,
                cleanOrigin,
                cleanDestination,
                trip_date,
                route.distance_km,
                route.duration_minutes,
                revenueNumber,
                calculatedFuelCost,
                otherCostsNumber,
                tripStatus
            ]
        );


        res.status(201).json({
            ...result.rows[0],

            fuel_used_liters:
                Number(
                    fuelUsed.toFixed(2)
                ),

            fuel_price:
                fuelPriceNumber
        });

    } catch (error) {
        console.log(error);

        res.status(500).json({
            error: "Could not create trip"
        });
    }
});


// update trip status
router.patch("/:id/status", async (req, res) => {
    try {
        const id =
            Number(req.params.id);

        const { status } =
            req.body;

        const allowedStatuses = [
            "planned",
            "completed",
            "cancelled"
        ];


        if (
            !Number.isInteger(id) ||
            id <= 0
        ) {
            return res.status(400).json({
                error: "Invalid trip ID"
            });
        }


        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                error: "Invalid trip status"
            });
        }


        const result = await pool.query(
            `
            UPDATE trips
            SET status = $1
            WHERE id = $2
            RETURNING *
            `,
            [
                status,
                id
            ]
        );


        if (result.rows.length === 0) {
            return res.status(404).json({
                error: "Trip not found"
            });
        }


        res.json(result.rows[0]);

    } catch (error) {
        console.log(error);

        res.status(500).json({
            error: "Could not update trip"
        });
    }
});


// delete trip
router.delete("/:id", async (req, res) => {
    try {
        const id =
            Number(req.params.id);


        if (
            !Number.isInteger(id) ||
            id <= 0
        ) {
            return res.status(400).json({
                error: "Invalid trip ID"
            });
        }


        const result = await pool.query(
            `
            DELETE FROM trips
            WHERE id = $1
            RETURNING *
            `,
            [id]
        );


        if (result.rows.length === 0) {
            return res.status(404).json({
                error: "Trip not found"
            });
        }


        res.json({
            message: "Trip deleted"
        });

    } catch (error) {
        console.log(error);

        res.status(500).json({
            error: "Could not delete trip"
        });
    }
});


module.exports = router;