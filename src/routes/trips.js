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
                trips.driver_id,
                trips.vehicle_id,
                trips.origin,
                trips.destination,
                trips.trip_date,
                trips.distance_km,
                trips.duration_minutes,
                trips.revenue,
                trips.fuel_cost,
                trips.other_costs,
                trips.status,
                trips.started_at,
                trips.completed_at,
                trips.cancelled_at,
                trips.cancellation_note,

                (
                    trips.revenue
                    - trips.fuel_cost
                    - trips.other_costs
                ) AS profit,

                CASE
                    WHEN trips.started_at IS NOT NULL
                    AND trips.completed_at IS NOT NULL
                    THEN ROUND(
                        EXTRACT(
                            EPOCH FROM (
                                trips.completed_at
                                - trips.started_at
                            )
                        ) / 60
                    )
                    ELSE NULL
                END AS actual_duration_minutes,

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


        // every new trip starts as planned
        if (tripStatus !== "planned") {
            return res.status(400).json({
                error: "New trips must start as planned"
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

        const {
            status,
            cancellation_note
        } = req.body;

        const allowedStatuses = [
            "planned",
            "in_progress",
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


        // load current trip
        const tripResult = await pool.query(
            `
            SELECT
                id,
                driver_id,
                vehicle_id,
                status
            FROM trips
            WHERE id = $1
            `,
            [id]
        );


        if (tripResult.rows.length === 0) {
            return res.status(404).json({
                error: "Trip not found"
            });
        }


        const trip =
            tripResult.rows[0];

        const currentStatus =
            trip.status;


        // allowed status changes
        const allowedTransitions = {
            planned: [
                "in_progress",
                "cancelled"
            ],

            in_progress: [
                "completed",
                "cancelled"
            ],

            completed: [],
            cancelled: []
        };


        if (
            !allowedTransitions[currentStatus] ||
            !allowedTransitions[currentStatus]
                .includes(status)
        ) {
            return res.status(400).json({
                error:
                    `Cannot change trip from ${currentStatus} to ${status}`
            });
        }


        // starting a trip
        if (status === "in_progress") {

            // check if driver is already on another trip
            const driverTrip =
                await pool.query(
                    `
                    SELECT id
                    FROM trips
                    WHERE driver_id = $1
                    AND status = 'in_progress'
                    AND id <> $2
                    LIMIT 1
                    `,
                    [
                        trip.driver_id,
                        id
                    ]
                );


            if (driverTrip.rows.length > 0) {
                return res.status(409).json({
                    error:
                        "Driver is already assigned to an active trip"
                });
            }


            // check if vehicle is already on another trip
            const vehicleTrip =
                await pool.query(
                    `
                    SELECT id
                    FROM trips
                    WHERE vehicle_id = $1
                    AND status = 'in_progress'
                    AND id <> $2
                    LIMIT 1
                    `,
                    [
                        trip.vehicle_id,
                        id
                    ]
                );


            if (vehicleTrip.rows.length > 0) {
                return res.status(409).json({
                    error:
                        "Vehicle is already assigned to an active trip"
                });
            }


            const result = await pool.query(
                `
                UPDATE trips
                SET
                    status = 'in_progress',
                    started_at = CURRENT_TIMESTAMP
                WHERE id = $1
                RETURNING *
                `,
                [id]
            );


            return res.json(
                result.rows[0]
            );
        }


        // completing a trip
        if (status === "completed") {
            const result = await pool.query(
                `
                UPDATE trips
                SET
                    status = 'completed',
                    completed_at = CURRENT_TIMESTAMP
                WHERE id = $1
                RETURNING *
                `,
                [id]
            );


            return res.json(
                result.rows[0]
            );
        }


        // cancelling a trip
        if (status === "cancelled") {

            if (
                typeof cancellation_note !== "string" ||
                cancellation_note.trim() === ""
            ) {
                return res.status(400).json({
                    error:
                        "Cancellation note is required"
                });
            }


            const cleanCancellationNote =
                cancellation_note.trim();


            const result = await pool.query(
                `
                UPDATE trips
                SET
                    status = 'cancelled',
                    cancelled_at = CURRENT_TIMESTAMP,
                    cancellation_note = $1
                WHERE id = $2
                RETURNING *
                `,
                [
                    cleanCancellationNote,
                    id
                ]
            );


            return res.json(
                result.rows[0]
            );
        }


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


        const tripResult = await pool.query(
            `
            SELECT status
            FROM trips
            WHERE id = $1
            `,
            [id]
        );


        if (tripResult.rows.length === 0) {
            return res.status(404).json({
                error: "Trip not found"
            });
        }


        // active trips should be completed or cancelled first
        if (
            tripResult.rows[0].status ===
            "in_progress"
        ) {
            return res.status(409).json({
                error:
                    "An active trip cannot be deleted"
            });
        }


        await pool.query(
            `
            DELETE FROM trips
            WHERE id = $1
            `,
            [id]
        );


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