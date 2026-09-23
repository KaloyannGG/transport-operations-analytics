CREATE TABLE drivers (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(50),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE vehicles (
    id SERIAL PRIMARY KEY,
    registration_number VARCHAR(20) UNIQUE NOT NULL,
    make VARCHAR(100) NOT NULL,
    model VARCHAR(100),
    fuel_type VARCHAR(50) DEFAULT 'Diesel',

    average_consumption NUMERIC(5,2) NOT NULL
        CHECK (average_consumption > 0),

    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE trips (
    id SERIAL PRIMARY KEY,

    driver_id INTEGER NOT NULL
        REFERENCES drivers(id),

    vehicle_id INTEGER NOT NULL
        REFERENCES vehicles(id),

    origin VARCHAR(150) NOT NULL,
    destination VARCHAR(150) NOT NULL,

    trip_date DATE NOT NULL,

    distance_km NUMERIC(10,2) NOT NULL
        CHECK (distance_km > 0),

    duration_minutes INTEGER NOT NULL
        CHECK (duration_minutes > 0),

    revenue NUMERIC(12,2) NOT NULL
        CHECK (revenue > 0),

    fuel_cost NUMERIC(12,2) NOT NULL DEFAULT 0
        CHECK (fuel_cost >= 0),

    other_costs NUMERIC(12,2) NOT NULL DEFAULT 0
        CHECK (other_costs >= 0),

    status VARCHAR(50) NOT NULL DEFAULT 'planned'
        CHECK (
            status IN (
                'planned',
                'in_progress',
                'completed',
                'cancelled'
            )
        ),

    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    cancelled_at TIMESTAMP,
    cancellation_note TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE UNIQUE INDEX one_active_trip_per_driver
ON trips(driver_id)
WHERE status = 'in_progress';


CREATE UNIQUE INDEX one_active_trip_per_vehicle
ON trips(vehicle_id)
WHERE status = 'in_progress';