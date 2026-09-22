// Helper used before adding text inside table HTML.
function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

// Loads the main dashboard totals.
async function loadSummary() {
    try {
        const response =
            await fetch("/api/analytics/summary");

        const data =
            await response.json();

        document.getElementById("totalTrips").textContent =
            data.total_trips;

        document.getElementById("totalKm").textContent =
            Number(data.total_km).toFixed(0);

        document.getElementById("totalRevenue").textContent =
            `€${Number(data.total_revenue).toFixed(2)}`;

        document.getElementById("fuelCosts").textContent =
            `€${Number(data.total_fuel_cost).toFixed(2)}`;

        document.getElementById("totalProfit").textContent =
            `€${Number(data.total_profit).toFixed(2)}`;

        document.getElementById("profitMargin").textContent =
            `${Number(data.profit_margin).toFixed(2)}%`;

    } catch (error) {
        console.log(
            "Could not load summary",
            error
        );
    }
}

// Loads driver performance data.
async function loadDrivers() {
    try {
        const response =
            await fetch("/api/analytics/drivers");

        const drivers =
            await response.json();

        const table =
            document.getElementById("driversTable");

        table.innerHTML = "";


        drivers.forEach(driver => {
            const row =
                document.createElement("tr");

            row.innerHTML = `
                <td>
                    ${escapeHtml(driver.first_name)}
                    ${escapeHtml(driver.last_name)}
                </td>

                <td>
                    ${Number(driver.total_trips)}
                </td>

                <td>
                    ${Number(driver.total_km).toFixed(0)}
                </td>

                <td>
                    €${Number(driver.total_revenue).toFixed(2)}
                </td>

                <td>
                    €${Number(driver.total_profit).toFixed(2)}
                </td>

                <td>
                    <button
                        class="delete-btn"
                        onclick="deleteDriver(${Number(driver.id)})"
                    >
                        ×
                    </button>
                </td>
            `;

            table.appendChild(row);
        });

    } catch (error) {
        console.log(
            "Could not load drivers",
            error
        );
    }
}

// Loads vehicle performance data.
async function loadVehicles() {
    try {
        const response =
            await fetch("/api/analytics/vehicles");

        const vehicles =
            await response.json();

        const table =
            document.getElementById("vehiclesTable");

        table.innerHTML = "";


        vehicles.forEach(vehicle => {
            const row =
                document.createElement("tr");

            row.innerHTML = `
                <td>
                    ${escapeHtml(vehicle.registration_number)}
                    -
                    ${escapeHtml(vehicle.make)}
                    ${escapeHtml(vehicle.model || "")}
                </td>

                <td>
                    ${Number(vehicle.total_trips)}
                </td>

                <td>
                    ${Number(vehicle.total_km).toFixed(0)}
                </td>

                <td>
                    €${Number(vehicle.total_revenue).toFixed(2)}
                </td>

                <td>
                    €${Number(vehicle.total_fuel_cost).toFixed(2)}
                </td>

                <td>
                    €${Number(vehicle.total_profit).toFixed(2)}
                </td>

                <td>
                    <button
                        class="delete-btn"
                        onclick="deleteVehicle(${Number(vehicle.id)})"
                    >
                        ×
                    </button>
                </td>
            `;

            table.appendChild(row);
        });

    } catch (error) {
        console.log(
            "Could not load vehicles",
            error
        );
    }
}

// Loads all trips and builds the trips table.
async function loadTrips() {
    try {
        const response =
            await fetch("/api/trips");

        const trips =
            await response.json();

        const table =
            document.getElementById("tripsTable");

        table.innerHTML = "";


        trips.forEach(trip => {
            const date =
                new Date(trip.trip_date)
                    .toLocaleDateString("en-GB");

            const id =
                Number(trip.id);

            const row =
                document.createElement("tr");


            row.innerHTML = `
                <td>
                    ${escapeHtml(date)}
                </td>

                <td>
                    ${escapeHtml(trip.first_name)}
                    ${escapeHtml(trip.last_name)}
                </td>

                <td>
                    ${escapeHtml(trip.registration_number)}
                </td>

                <td>
                    ${escapeHtml(trip.origin)}
                    →
                    ${escapeHtml(trip.destination)}
                </td>

                <td>
                    ${Number(trip.distance_km).toFixed(0)}
                </td>

                <td>
                    <select
                        class="trip-status ${trip.status}"
                        onchange="updateTripStatus(${id}, this.value)"
                    >
                        <option
                            value="planned"
                            ${trip.status === "planned" ? "selected" : ""}
                        >
                            Planned
                        </option>

                        <option
                            value="completed"
                            ${trip.status === "completed" ? "selected" : ""}
                        >
                            Completed
                        </option>

                        <option
                            value="cancelled"
                            ${trip.status === "cancelled" ? "selected" : ""}
                        >
                            Cancelled
                        </option>
                    </select>
                </td>

                <td>
                    €${Number(trip.revenue).toFixed(2)}
                </td>

                <td>
                    €${Number(trip.fuel_cost).toFixed(2)}
                </td>

                <td>
                    €${Number(trip.profit).toFixed(2)}
                </td>

                <td>
                    <button
                        class="delete-btn"
                        onclick="deleteTrip(${id})"
                    >
                        ×
                    </button>
                </td>
            `;

            table.appendChild(row);
        });

    } catch (error) {
        console.log(
            "Could not load trips",
            error
        );
    }
}

// Loads drivers and vehicles for the Add Trip dropdowns.
async function loadFormOptions() {
    try {
        const driversResponse =
            await fetch("/api/drivers");

        const drivers =
            await driversResponse.json();

        const vehiclesResponse =
            await fetch("/api/vehicles");

        const vehicles =
            await vehiclesResponse.json();

        const driverSelect =
            document.getElementById("driver");

        const vehicleSelect =
            document.getElementById("vehicle");


        driverSelect.innerHTML =
            `<option value="">Select driver</option>`;

        vehicleSelect.innerHTML =
            `<option value="">Select vehicle</option>`;


        drivers.forEach(driver => {
            const option =
                document.createElement("option");

            option.value =
                driver.id;

            option.textContent =
                `${driver.first_name} ${driver.last_name}`;

            driverSelect.appendChild(option);
        });


        vehicles.forEach(vehicle => {
            const option =
                document.createElement("option");

            option.value =
                vehicle.id;

            option.textContent =
                `${vehicle.registration_number} - ${vehicle.make} ${vehicle.model || ""}`;

            vehicleSelect.appendChild(option);
        });

    } catch (error) {
        console.log(
            "Could not load form options",
            error
        );
    }
}

// Add Driver form.
const driverForm =
    document.getElementById("driverForm");

driverForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();

        const driver = {
            first_name:
                document
                    .getElementById("driverFirstName")
                    .value
                    .trim(),

            last_name:
                document
                    .getElementById("driverLastName")
                    .value
                    .trim(),

            phone:
                document
                    .getElementById("driverPhone")
                    .value
                    .trim()
        };


        const message =
            document.getElementById(
                "driverMessage"
            );


        try {
            const response =
                await fetch("/api/drivers", {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify(driver)
                });


            const data =
                await response.json();


            if (!response.ok) {
                throw new Error(
                    data.error ||
                    "Could not add driver"
                );
            }


            message.textContent =
                "Driver added";

            driverForm.reset();

            await refreshDashboard();

        } catch (error) {
            message.textContent =
                error.message;
        }
    }
);

// Add Vehicle form.
const vehicleForm =
    document.getElementById("vehicleForm");

vehicleForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();

        const vehicle = {
            registration_number:
                document
                    .getElementById("registrationNumber")
                    .value
                    .trim(),

            make:
                document
                    .getElementById("vehicleMake")
                    .value
                    .trim(),

            model:
                document
                    .getElementById("vehicleModel")
                    .value
                    .trim(),

            average_consumption:
                Number(
                    document
                        .getElementById("vehicleConsumption")
                        .value
                )
        };


        const message =
            document.getElementById(
                "vehicleMessage"
            );


        try {
            const response =
                await fetch("/api/vehicles", {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify(vehicle)
                });


            const data =
                await response.json();


            if (!response.ok) {
                throw new Error(
                    data.error ||
                    "Could not add vehicle"
                );
            }


            message.textContent =
                "Vehicle added";

            vehicleForm.reset();

            await refreshDashboard();

        } catch (error) {
            message.textContent =
                error.message;
        }
    }
);

// Add Trip form.
// Distance and fuel cost are calculated by the backend.
const tripForm =
    document.getElementById("tripForm");

tripForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();

        const message =
            document.getElementById(
                "formMessage"
            );
        const submitButton =
            tripForm.querySelector(
                'button[type="submit"]'
             );


        const trip = {
            driver_id:
                Number(
                    document
                        .getElementById("driver")
                        .value
                ),

            vehicle_id:
                Number(
                    document
                        .getElementById("vehicle")
                        .value
                ),

            origin:
                document
                    .getElementById("origin")
                    .value
                    .trim(),

            destination:
                document
                    .getElementById("destination")
                    .value
                    .trim(),

            trip_date:
                document
                    .getElementById("tripDate")
                    .value,

            revenue:
                Number(
                    document
                        .getElementById("revenue")
                        .value
                ),

            fuel_price:
                Number(
                    document
                        .getElementById("fuelPrice")
                        .value
                ),

            other_costs:
                Number(
                    document
                        .getElementById("otherCosts")
                        .value
                ),

            status:
                document
                    .getElementById("tripStatus")
                    .value
        };


        try {
            message.textContent =
                "Calculating route and saving trip...";

        submitButton.disabled = true;
        submitButton.textContent = "Calculating...";

            const response =
                await fetch("/api/trips", {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify(trip)
                });


            const data =
                await response.json();


            if (!response.ok) {
                throw new Error(
                    data.error ||
                    "Could not add trip"
                );
            }


            message.textContent =
                `Trip added: ${data.distance_km} km`;


            tripForm.reset();

            await refreshDashboard();

        } catch (error) {
            message.textContent =
                `Error: ${error.message}`;
        }  finally {
                submitButton.disabled = false;
                submitButton.textContent = "Add Trip";
        }
    }
);

// Updates only the trip status.
async function updateTripStatus(id, status) {
    try {
        const response =
            await fetch(
                `/api/trips/${id}/status`,
                {
                    method: "PATCH",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            status
                        })
                }
            );


        const data =
            await response.json();


        if (!response.ok) {
            alert(
                data.error ||
                "Could not update trip"
            );

            return;
        }


        await refreshDashboard();

    } catch (error) {
        console.log(error);

        alert(
            "Could not update trip status"
        );
    }
}

// Deletes a trip after confirmation.
async function deleteTrip(id) {
    if (!confirm("Delete this trip?")) {
        return;
    }


    try {
        const response =
            await fetch(
                `/api/trips/${id}`,
                {
                    method: "DELETE"
                }
            );


        const data =
            await response.json();


        if (!response.ok) {
            alert(data.error);
            return;
        }


        await refreshDashboard();

    } catch (error) {
        console.log(error);

        alert(
            "Could not delete trip"
        );
    }
}

// Driver cannot be deleted if it is already used in a trip.
async function deleteDriver(id) {
    if (!confirm("Delete this driver?")) {
        return;
    }


    try {
        const response =
            await fetch(
                `/api/drivers/${id}`,
                {
                    method: "DELETE"
                }
            );


        const data =
            await response.json();


        if (!response.ok) {
            alert(data.error);
            return;
        }


        await refreshDashboard();

    } catch (error) {
        console.log(error);

        alert(
            "Could not delete driver"
        );
    }
}

// Vehicle cannot be deleted if it is already used in a trip.
async function deleteVehicle(id) {
    if (!confirm("Delete this vehicle?")) {
        return;
    }


    try {
        const response =
            await fetch(
                `/api/vehicles/${id}`,
                {
                    method: "DELETE"
                }
            );


        const data =
            await response.json();


        if (!response.ok) {
            alert(data.error);
            return;
        }


        await refreshDashboard();

    } catch (error) {
        console.log(error);

        alert(
            "Could not delete vehicle"
        );
    }
}

// Reloads the dashboard after a change.
async function refreshDashboard() {
    await loadSummary();
    await loadDrivers();
    await loadVehicles();
    await loadTrips();
    await loadFormOptions();
}

refreshDashboard();