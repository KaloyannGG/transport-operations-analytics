// Helper used before adding text inside table HTML.
function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


let loadedTrips = [];

// Converts minutes to something like 2h 15m.
function formatDuration(value) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return "—";
    }

    const totalMinutes =
        Math.round(Number(value));

    if (!Number.isFinite(totalMinutes)) {
        return "—";
    }

    const hours =
        Math.floor(totalMinutes / 60);

    const minutes =
        totalMinutes % 60;

    if (hours === 0) {
        return `${minutes}m`;
    }

    return `${hours}h ${minutes}m`;
}


// Formats database timestamps for the table.
function formatDateTime(value) {

    if (!value) {
        return "—";
    }

    return new Date(value)
        .toLocaleString("en-GB", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
}


function getStatusLabel(status) {

    const labels = {
        planned: "Planned",
        in_progress: "In Progress",
        completed: "Completed",
        cancelled: "Cancelled"
    };

    return labels[status] || status;
}


// Only shows valid next statuses.
function getStatusOptions(status) {

    if (status === "planned") {
        return [
            "planned",
            "in_progress",
            "cancelled"
        ];
    }

    if (status === "in_progress") {
        return [
            "in_progress",
            "completed",
            "cancelled"
        ];
    }

    return [status];
}


// Builds the timing text shown in the trips table.
function getTripTiming(trip) {

    if (trip.status === "planned") {
        return `
            <div>
                Est. ${formatDuration(trip.duration_minutes)}
            </div>
        `;
    }


    if (trip.status === "in_progress") {
        return `
            <div>
                Started:
                ${escapeHtml(formatDateTime(trip.started_at))}
            </div>

            <small>
                Est. ${formatDuration(trip.duration_minutes)}
            </small>
        `;
    }


    if (trip.status === "completed") {
        return `
            <div>
                Actual:
                ${formatDuration(trip.actual_duration_minutes)}
            </div>

            <small>
                Est. ${formatDuration(trip.duration_minutes)}
            </small>
        `;
    }


    if (trip.status === "cancelled") {
        return `
            <div>
                Cancelled:
                ${escapeHtml(formatDateTime(trip.cancelled_at))}
            </div>
        `;
    }


    return "—";
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
                    ${escapeHtml(driver.availability)}
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
                    ${escapeHtml(vehicle.availability)}
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

        loadedTrips = trips;


        const table =
            document.getElementById("tripsTable");

        table.innerHTML = "";


        trips.forEach(trip => {

            const date =
                new Date(trip.trip_date)
                    .toLocaleDateString("en-GB");

            const id =
                Number(trip.id);

            const terminalStatus =
                trip.status === "completed" ||
                trip.status === "cancelled";

            const statusOptions =
                getStatusOptions(trip.status)
                    .map(status => `
                        <option
                            value="${status}"
                            ${status === trip.status ? "selected" : ""}
                        >
                            ${getStatusLabel(status)}
                        </option>
                    `)
                    .join("");


            const cancellationNote =
                trip.status === "cancelled" &&
                    trip.cancellation_note
                    ? `
                        <div class="trip-note">
                            ${escapeHtml(trip.cancellation_note)}
                        </div>
                    `
                    : "";


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
                        onchange="requestTripStatusChange(${id}, this)"
                        ${terminalStatus ? "disabled" : ""}
                    >
                        ${statusOptions}
                    </select>

                    ${cancellationNote}

                </td>

                <td class="trip-timing">
                    ${getTripTiming(trip)}
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
                )
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
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = "Add Trip";
        }
    }
);

const statusModal =
    document.getElementById("statusModal");

const statusModalTitle =
    document.getElementById("statusModalTitle");

const statusModalDetails =
    document.getElementById("statusModalDetails");

const statusModalInfo =
    document.getElementById("statusModalInfo");

const cancellationNoteGroup =
    document.getElementById("cancellationNoteGroup");

const cancellationNote =
    document.getElementById("cancellationNote");

const statusModalError =
    document.getElementById("statusModalError");

const statusModalBack =
    document.getElementById("statusModalBack");

const statusModalConfirm =
    document.getElementById("statusModalConfirm");


let pendingStatusChange = null;


// Opens the confirmation window before changing status.
function requestTripStatusChange(id, selectElement) {

    const trip =
        loadedTrips.find(
            trip =>
                Number(trip.id) === Number(id)
        );


    if (!trip) {
        selectElement.value = "planned";
        return;
    }


    const newStatus =
        selectElement.value;


    if (newStatus === trip.status) {
        return;
    }


    pendingStatusChange = {
        trip,
        newStatus,
        oldStatus: trip.status,
        selectElement
    };


    statusModalDetails.textContent =
        `${trip.first_name} ${trip.last_name} | ` +
        `${trip.registration_number} | ` +
        `${trip.origin} → ${trip.destination}`;


    cancellationNote.value = "";
    statusModalError.textContent = "";


    if (newStatus === "in_progress") {

        statusModalTitle.textContent =
            "Start this trip?";

        statusModalInfo.textContent =
            "The start time will be saved automatically.";

        statusModalConfirm.textContent =
            "Start Trip";

        cancellationNoteGroup.hidden = true;
    }


    if (newStatus === "completed") {

        statusModalTitle.textContent =
            "Complete this trip?";

        statusModalInfo.textContent =
            "The completion time will be saved automatically.";

        statusModalConfirm.textContent =
            "Complete Trip";

        cancellationNoteGroup.hidden = true;
    }


    if (newStatus === "cancelled") {

        statusModalTitle.textContent =
            "Cancel this trip?";

        statusModalInfo.textContent =
            "The cancellation time will be saved automatically.";

        statusModalConfirm.textContent =
            "Cancel Trip";

        cancellationNoteGroup.hidden = false;
    }


    statusModal.hidden = false;
}


// Closes the modal.
// If the change was not saved, the old status is restored.
function closeStatusModal(restoreStatus = true) {

    if (
        restoreStatus &&
        pendingStatusChange
    ) {
        pendingStatusChange
            .selectElement
            .value =
            pendingStatusChange.oldStatus;
    }


    statusModal.hidden = true;

    cancellationNote.value = "";
    statusModalError.textContent = "";

    pendingStatusChange = null;
}


statusModalBack.addEventListener(
    "click",
    () => {
        closeStatusModal(true);
    }
);


statusModalConfirm.addEventListener(
    "click",
    async () => {

        if (!pendingStatusChange) {
            return;
        }


        const {
            trip,
            newStatus
        } = pendingStatusChange;


        const body = {
            status: newStatus
        };


        if (newStatus === "cancelled") {

            const note =
                cancellationNote
                    .value
                    .trim();


            if (!note) {

                statusModalError.textContent =
                    "Please enter a cancellation reason.";

                return;
            }


            body.cancellation_note =
                note;
        }


        try {

            statusModalConfirm.disabled = true;


            const response =
                await fetch(
                    `/api/trips/${trip.id}/status`,
                    {
                        method: "PATCH",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify(body)
                    }
                );


            const data =
                await response.json();


            if (!response.ok) {

                statusModalError.textContent =
                    data.error ||
                    "Could not update trip.";

                return;
            }


            closeStatusModal(false);

            await refreshDashboard();


        } catch (error) {

            console.log(error);

            statusModalError.textContent =
                "Could not update trip status.";

        } finally {

            statusModalConfirm.disabled = false;
        }
    }
);

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