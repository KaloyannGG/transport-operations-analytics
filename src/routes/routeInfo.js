const express = require("express");
const getCoordinates = require("../services/geocoding");
const getRoute = require("../services/routing");

const router = express.Router();


router.get("/", async (req, res) => {
    try {
        const {
            from,
            to
        } = req.query;


        if (!from || !to) {
            return res.status(400).json({
                error: "From and to are required"
            });
        }


        const start =
            await getCoordinates(from);

        const end =
            await getCoordinates(to);

        const route =
            await getRoute(start, end);


        res.json({
            from: start,
            to: end,
            distance_km: route.distance_km,
            duration_minutes:
                route.duration_minutes
        });

    } catch (error) {
        console.log(error);

        res.status(500).json({
            error: "Could not calculate route"
        });
    }
});


module.exports = router;