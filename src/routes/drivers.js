const express = require("express");
const pool = require("../db/database");

const router = express.Router();


// get all drivers
router.get("/", async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT * FROM drivers ORDER BY id"
        );

        res.json(result.rows);
    } catch (error) {
        console.log(error);
        res.status(500).json({
            error: "Something went wrong"
        });
    }
});


// add driver
router.post("/", async (req, res) => {
    try {
        const {
            first_name,
            last_name,
            phone
        } = req.body;

        if (!first_name || !last_name) {
            return res.status(400).json({
                error: "First name and last name are required"
            });
        }

        const result = await pool.query(
            `
            INSERT INTO drivers (
                first_name,
                last_name,
                phone
            )
            VALUES ($1, $2, $3)
            RETURNING *
            `,
            [
                first_name,
                last_name,
                phone || null
            ]
        );

        res.status(201).json(result.rows[0]);

    } catch (error) {
        console.log(error);

        res.status(500).json({
            error: "Something went wrong"
        });
    }
});


// delete driver
router.delete("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const trips = await pool.query(
            `
            SELECT COUNT(*) 
            FROM trips
            WHERE driver_id = $1
            `,
            [id]
        );

        if (Number(trips.rows[0].count) > 0) {
            return res.status(400).json({
                error: "Driver cannot be deleted because trips are linked to this driver"
            });
        }

        const result = await pool.query(
            `
            DELETE FROM drivers
            WHERE id = $1
            RETURNING *
            `,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: "Driver not found"
            });
        }

        res.json({
            message: "Driver deleted"
        });

    } catch (error) {
        console.log(error);

        res.status(500).json({
            error: "Something went wrong"
        });
    }
});


module.exports = router;