async function getRoute(start, end) {
    const response = await fetch(
        "https://api.heigit.org/openrouteservice/v2/directions/driving-car",
        {
            method: "POST",
            headers: {
                "Authorization": process.env.ORS_API_KEY,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                coordinates: [
                    [start.longitude, start.latitude],
                    [end.longitude, end.latitude]
                ]
            })
        }
    );

    if (!response.ok) {
        throw new Error("Could not calculate route");
    }

    const data = await response.json();

    const summary = data.routes[0].summary;

    return {
        distance_km: Math.round(summary.distance / 1000),
        duration_minutes: Math.round(summary.duration / 60)
    };
}

module.exports = getRoute;