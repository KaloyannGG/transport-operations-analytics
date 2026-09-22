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
    average_consumption NUMERIC(5,2),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE trips (
    id SERIAL PRIMARY KEY,

    driver_id INTEGER REFERENCES drivers(id),
    vehicle_id INTEGER REFERENCES vehicles(id),

    origin VARCHAR(150) NOT NULL,
    destination VARCHAR(150) NOT NULL,

    trip_date DATE NOT NULL,

    distance_km NUMERIC(10,2),
    duration_minutes INTEGER,

    revenue NUMERIC(12,2) NOT NULL,
    fuel_cost NUMERIC(12,2) DEFAULT 0,
    other_costs NUMERIC(12,2) DEFAULT 0,

    status VARCHAR(50) DEFAULT 'planned',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);