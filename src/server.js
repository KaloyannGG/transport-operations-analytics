const express = require("express");
const pool = require("./db/database");
const driversRouter = require("./routes/drivers");
const vehiclesRouter = require("./routes/vehicles");
const tripsRouter = require("./routes/trips");
const analyticsRouter = require("./routes/analytics");
const routeInfoRouter = require("./routes/routeInfo");
const app = express();

app.use(express.static("public"));

app.use(express.json());
app.use("/api/drivers", driversRouter);
app.use("/api/vehicles", vehiclesRouter);
app.use("/api/trips", tripsRouter);
app.use("/api/analytics", analyticsRouter);
app.use("/api/route-info", routeInfoRouter);

const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
    res.json({
        message: "Transport Operations Analytics API is running"
    });
});

app.get("/api/database-test", async (req, res) => {
    try {
        const result = await pool.query("SELECT NOW()");

        res.json({
            success: true,
            databaseTime: result.rows[0].now
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            error: "Database connection failed"
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});