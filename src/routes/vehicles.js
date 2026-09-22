const express = require("express");
const pool = require("../db/database");

const router = express.Router();


// get all vehicles
router.get("/", async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT * FROM vehicles ORDER BY id"
        );

        res.json(result.rows);

    } catch (error) {
        console.log(error);

        res.status(500).json({
            error: "Something went wrong"
        });
    }
});


// add vehicle
router.post("/", async (req, res) => {
    try {
        const {
            registration_number,
            make,
            model,
            fuel_type,
            average_consumption
        } = req.body;

        // Clean the text values before validation and saving
        const registration =
            typeof registration_number === "string"
                ? registration_number.trim().toUpperCase()
                : "";

        const vehicleMake =
            typeof make === "string"
                ? make.trim()
                : "";

        const vehicleModel =
            typeof model === "string"
                ? model.trim()
                : "";

        const fuelType =
            typeof fuel_type === "string" && fuel_type.trim()
                ? fuel_type.trim()
                : "Diesel";

        const consumption =
            Number(average_consumption);

        if (!registration || !vehicleMake) {
            return res.status(400).json({
                error: "Registration and make are required"
            });
        }

        if (
            !Number.isFinite(consumption) ||
            consumption <= 0
        ) {
            return res.status(400).json({
                error: "Average consumption must be greater than 0"
            });
        }

        const result = await pool.query(
            `
            INSERT INTO vehicles (
                registration_number,
                make,
                model,
                fuel_type,
                average_consumption
            )
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
            `,
            [
                registration,
                vehicleMake,
                vehicleModel || null,
                fuelType,
                consumption
            ]
        );

        res.status(201).json(result.rows[0]);

    } catch (error) {
        console.log(error);

        // PostgreSQL error code for a UNIQUE constraint violation
        if (error.code === "23505") {
            return res.status(409).json({
                error: "A vehicle with this registration already exists"
            });
        }

        res.status(500).json({
            error: "Something went wrong"
        });
    }
});


// delete vehicle
router.delete("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const trips = await pool.query(
            `
            SELECT COUNT(*)
            FROM trips
            WHERE vehicle_id = $1
            `,
            [id]
        );

        if (Number(trips.rows[0].count) > 0) {
            return res.status(400).json({
                error: "Vehicle cannot be deleted because trips are linked to it"
            });
        }

        const result = await pool.query(
            `
            DELETE FROM vehicles
            WHERE id = $1
            RETURNING *
            `,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: "Vehicle not found"
            });
        }

        res.json({
            message: "Vehicle deleted"
        });

    } catch (error) {
        console.log(error);

        res.status(500).json({
            error: "Something went wrong"
        });
    }
});


module.exports = router;