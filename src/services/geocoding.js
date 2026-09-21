async function getCoordinates(city) {
    const url =
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`;

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error("Could not get location data");
    }

    const data = await response.json();

    if (!data.results || data.results.length === 0) {
        throw new Error(`Location not found: ${city}`);
    }

    const location = data.results[0];

    return {
        name: location.name,
        country: location.country,
        latitude: location.latitude,
        longitude: location.longitude
    };
}

module.exports = getCoordinates;