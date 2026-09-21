const express = require("express");
const pool = require("../db/database");

const router = express.Router();


// overall analytics - completed trips only
router.get("/summary", async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                COUNT(*) AS total_trips,

                COALESCE(
                    SUM(distance_km),
                    0
                ) AS total_km,

                COALESCE(
                    SUM(revenue),
                    0
                ) AS total_revenue,

                COALESCE(
                    SUM(fuel_cost),
                    0
                ) AS total_fuel_cost,

                COALESCE(
                    SUM(other_costs),
                    0
                ) AS total_other_costs,

                COALESCE(
                    SUM(
                        revenue
                        - fuel_cost
                        - other_costs
                    ),
                    0
                ) AS total_profit,

                CASE
                    WHEN SUM(revenue) > 0 THEN
                        ROUND(
                            SUM(
                                revenue
                                - fuel_cost
                                - other_costs
                            )
                            / SUM(revenue) * 100,
                            2
                        )
                    ELSE 0
                END AS profit_margin

            FROM trips
            WHERE status = 'completed'
        `);

        res.json(result.rows[0]);

    } catch (error) {
        console.log(error);

        res.status(500).json({
            error: "Could not load analytics"
        });
    }
});


// driver performance
router.get("/drivers", async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                drivers.id,
                drivers.first_name,
                drivers.last_name,

                COUNT(trips.id) AS total_trips,

                COALESCE(
                    SUM(trips.distance_km),
                    0
                ) AS total_km,

                COALESCE(
                    SUM(trips.revenue),
                    0
                ) AS total_revenue,

                COALESCE(
                    SUM(
                        trips.revenue
                        - trips.fuel_cost
                        - trips.other_costs
                    ),
                    0
                ) AS total_profit

            FROM drivers

            LEFT JOIN trips
                ON drivers.id = trips.driver_id
                AND trips.status = 'completed'

            GROUP BY
                drivers.id,
                drivers.first_name,
                drivers.last_name

            ORDER BY total_profit DESC
        `);

        res.json(result.rows);

    } catch (error) {
        console.log(error);

        res.status(500).json({
            error: "Could not load driver analytics"
        });
    }
});


// vehicle performance
router.get("/vehicles", async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                vehicles.id,
                vehicles.registration_number,
                vehicles.make,
                vehicles.model,

                COUNT(trips.id) AS total_trips,

                COALESCE(
                    SUM(trips.distance_km),
                    0
                ) AS total_km,

                COALESCE(
                    SUM(trips.revenue),
                    0
                ) AS total_revenue,

                COALESCE(
                    SUM(trips.fuel_cost),
                    0
                ) AS total_fuel_cost,

                COALESCE(
                    SUM(
                        trips.revenue
                        - trips.fuel_cost
                        - trips.other_costs
                    ),
                    0
                ) AS total_profit

            FROM vehicles

            LEFT JOIN trips
                ON vehicles.id = trips.vehicle_id
                AND trips.status = 'completed'

            GROUP BY
                vehicles.id,
                vehicles.registration_number,
                vehicles.make,
                vehicles.model

            ORDER BY total_profit DESC
        `);

        res.json(result.rows);

    } catch (error) {
        console.log(error);

        res.status(500).json({
            error: "Could not load vehicle analytics"
        });
    }
});


module.exports = router;