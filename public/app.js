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
let currentTripStatusFilter = "active";

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

// Updates the driver and vehicle trip filters.
function updateTripFilterOptions() {

    const driverFilter =
        document.getElementById("tripDriverFilter");

    const vehicleFilter =
        document.getElementById("tripVehicleFilter");


    const selectedDriver =
        driverFilter.value;

    const selectedVehicle =
        vehicleFilter.value;


    const drivers = new Map();
    const vehicles = new Map();


    loadedTrips.forEach(trip => {

        drivers.set(
            Number(trip.driver_id),
            `${trip.first_name} ${trip.last_name}`
        );

        vehicles.set(
            Number(trip.vehicle_id),
            trip.registration_number
        );
    });


    driverFilter.innerHTML =
        `<option value="">All drivers</option>`;

    vehicleFilter.innerHTML =
        `<option value="">All vehicles</option>`;


    drivers.forEach((name, id) => {

        const option =
            document.createElement("option");

        option.value = id;
        option.textContent = name;

        driverFilter.appendChild(option);
    });


    vehicles.forEach((registration, id) => {

        const option =
            document.createElement("option");

        option.value = id;
        option.textContent = registration;

        vehicleFilter.appendChild(option);
    });


    if (
        [...drivers.keys()]
            .includes(Number(selectedDriver))
    ) {
        driverFilter.value =
            selectedDriver;
    }


    if (
        [...vehicles.keys()]
            .includes(Number(selectedVehicle))
    ) {
        vehicleFilter.value =
            selectedVehicle;
    }
}
// Applies the selected filters to the trips table.
function applyTripFilters() {

    const driverId =
        document
            .getElementById("tripDriverFilter")
            .value;

    const vehicleId =
        document
            .getElementById("tripVehicleFilter")
            .value;

    const search =
        document
            .getElementById("tripSearch")
            .value
            .trim()
            .toLowerCase();


    const filteredTrips =
        loadedTrips.filter(trip => {

            let matchesStatus = true;


            if (
                currentTripStatusFilter ===
                "active"
            ) {
                matchesStatus =
                    trip.status === "planned" ||
                    trip.status === "in_progress";
            }

            else if (
                currentTripStatusFilter !==
                "all"
            ) {
                matchesStatus =
                    trip.status ===
                    currentTripStatusFilter;
            }


            const matchesDriver =
                !driverId ||
                Number(trip.driver_id) ===
                    Number(driverId);


            const matchesVehicle =
                !vehicleId ||
                Number(trip.vehicle_id) ===
                    Number(vehicleId);


            const searchableText = `
                ${trip.first_name}
                ${trip.last_name}
                ${trip.registration_number}
                ${trip.origin}
                ${trip.destination}
            `.toLowerCase();


            const matchesSearch =
                !search ||
                searchableText.includes(search);


            return (
                matchesStatus &&
                matchesDriver &&
                matchesVehicle &&
                matchesSearch
            );
        });


    renderTrips(filteredTrips);
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

// Loads all trips from the backend.
async function loadTrips() {

    try {

        const response =
            await fetch("/api/trips");

        const trips =
            await response.json();


        loadedTrips =
            trips;


        updateTripFilterOptions();

        applyTripFilters();


    } catch (error) {

        console.log(
            "Could not load trips",
            error
        );
    }
}
// Builds the trips table using the supplied trips.
function renderTrips(trips) {

    const table =
        document.getElementById("tripsTable");


    table.innerHTML = "";


    trips.forEach(trip => {

        const date =
            new Date(trip.trip_date)
                .toLocaleDateString("en-GB");

        const id =
            Number(trip.id);


        let statusActions = "";


        if (trip.status === "planned") {

            statusActions = `
                <button
                    class="action-btn start-action"
                    onclick="requestTripStatusChange(${id}, 'in_progress')"
                >
                    Start
                </button>

                <button
                    class="action-btn danger-action"
                    onclick="requestTripStatusChange(${id}, 'cancelled')"
                >
                    Cancel
                </button>
            `;
        }


        if (trip.status === "in_progress") {

            statusActions = `
                <button
                    class="action-btn"
                    onclick="requestTripStatusChange(${id}, 'completed')"
                >
                    Complete
                </button>

                <button
                    class="action-btn danger-action"
                    onclick="requestTripStatusChange(${id}, 'cancelled')"
                >
                    Cancel
                </button>
            `;
        }


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
                <span class="status-badge status-${trip.status}">
                    ${escapeHtml(getStatusLabel(trip.status))}
                </span>
            </td>

            <td>
                €${Number(trip.revenue).toFixed(2)}
            </td>

            <td>
                €${Number(trip.profit).toFixed(2)}
            </td>

            <td>

                <div class="trip-actions">

                    ${statusActions}

                    <button
                        class="action-btn details-btn"
                        onclick="showTripDetails(${id})"
                    >
                        Details
                    </button>

                    <button
                        class="delete-btn"
                        onclick="deleteTrip(${id})"
                    >
                        ×
                    </button>

                </div>

            </td>
        `;


        table.appendChild(row);
    });
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
function requestTripStatusChange(id, newStatus) {

    const trip =
        loadedTrips.find(
            trip =>
                Number(trip.id) === Number(id)
        );


    if (!trip) {
        return;
    }


    pendingStatusChange = {
        trip,
        newStatus
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
function closeStatusModal() {

    statusModal.hidden = true;

    cancellationNote.value = "";
    statusModalError.textContent = "";

    pendingStatusChange = null;
}


statusModalBack.addEventListener(
    "click",
    () => {
        closeStatusModal();
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


            closeStatusModal();

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
const tripDetailsModal =
    document.getElementById("tripDetailsModal");

const tripDetailsContent =
    document.getElementById("tripDetailsContent");

const closeTripDetails =
    document.getElementById("closeTripDetails");


// Shows the full information for one trip.
function showTripDetails(id) {

    const trip =
        loadedTrips.find(
            trip =>
                Number(trip.id) === Number(id)
        );


    if (!trip) {
        return;
    }


    let timingDetails = `
        <div>
            <strong>Estimated time:</strong>
            ${formatDuration(trip.duration_minutes)}
        </div>
    `;


    if (trip.started_at) {

        timingDetails += `
            <div>
                <strong>Started:</strong>
                ${escapeHtml(formatDateTime(trip.started_at))}
            </div>
        `;
    }


    if (trip.completed_at) {

        timingDetails += `
            <div>
                <strong>Completed:</strong>
                ${escapeHtml(formatDateTime(trip.completed_at))}
            </div>

            <div>
                <strong>Actual time:</strong>
                ${formatDuration(trip.actual_duration_minutes)}
            </div>
        `;
    }


    if (trip.cancelled_at) {

        timingDetails += `
            <div>
                <strong>Cancelled:</strong>
                ${escapeHtml(formatDateTime(trip.cancelled_at))}
            </div>
        `;
    }


    let cancellationDetails = "";


    if (
        trip.status === "cancelled" &&
        trip.cancellation_note
    ) {

        cancellationDetails = `
            <div class="details-note">

                <strong>Cancellation reason:</strong>

                <p>
                    ${escapeHtml(trip.cancellation_note)}
                </p>

            </div>
        `;
    }


    tripDetailsContent.innerHTML = `

        <div class="details-grid">

            <div>
                <strong>Driver:</strong>
                ${escapeHtml(trip.first_name)}
                ${escapeHtml(trip.last_name)}
            </div>

            <div>
                <strong>Vehicle:</strong>
                ${escapeHtml(trip.registration_number)}
            </div>

            <div>
                <strong>Route:</strong>
                ${escapeHtml(trip.origin)}
                →
                ${escapeHtml(trip.destination)}
            </div>

            <div>
                <strong>Distance:</strong>
                ${Number(trip.distance_km).toFixed(0)} km
            </div>

            <div>
                <strong>Status:</strong>
                ${escapeHtml(getStatusLabel(trip.status))}
            </div>

            ${timingDetails}

            <div>
                <strong>Revenue:</strong>
                €${Number(trip.revenue).toFixed(2)}
            </div>

            <div>
                <strong>Fuel cost:</strong>
                €${Number(trip.fuel_cost).toFixed(2)}
            </div>

            <div>
                <strong>Other costs:</strong>
                €${Number(trip.other_costs).toFixed(2)}
            </div>

            <div>
                <strong>Profit:</strong>
                €${Number(trip.profit).toFixed(2)}
            </div>

        </div>

        ${cancellationDetails}
    `;


    tripDetailsModal.hidden = false;
}


closeTripDetails.addEventListener(
    "click",
    () => {
        tripDetailsModal.hidden = true;
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
const tripStatusTabs =
    document.querySelectorAll(".trip-tab");

const tripDriverFilter =
    document.getElementById("tripDriverFilter");

const tripVehicleFilter =
    document.getElementById("tripVehicleFilter");

const tripSearch =
    document.getElementById("tripSearch");


// Status tabs
tripStatusTabs.forEach(tab => {

    tab.addEventListener(
        "click",
        () => {

            tripStatusTabs.forEach(button => {
                button.classList.remove("active");
            });


            tab.classList.add("active");


            currentTripStatusFilter =
                tab.dataset.status;


            applyTripFilters();
        }
    );
});


// Driver filter
tripDriverFilter.addEventListener(
    "change",
    applyTripFilters
);


// Vehicle filter
tripVehicleFilter.addEventListener(
    "change",
    applyTripFilters
);


// Search
tripSearch.addEventListener(
    "input",
    applyTripFilters
);

refreshDashboard();