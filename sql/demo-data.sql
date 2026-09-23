-- Demo drivers
INSERT INTO drivers (
    first_name,
    last_name,
    phone
)
VALUES
    ('Ivan', 'Petrov', '0888123456'),
    ('Georgi', 'Dimitrov', '0888234567'),
    ('Nikolay', 'Ivanov', '0888345678');


-- Demo vehicles
INSERT INTO vehicles (
    registration_number,
    make,
    model,
    fuel_type,
    average_consumption
)
VALUES
    ('CT1234AB', 'Mercedes-Benz', 'Sprinter', 'Diesel', 10.5),
    ('CT5678KM', 'Ford', 'Transit', 'Diesel', 9.8),
    ('CT9012PK', 'Iveco', 'Daily', 'Diesel', 11.2);


-- Completed trip
INSERT INTO trips (
    driver_id,
    vehicle_id,
    origin,
    destination,
    trip_date,
    distance_km,
    duration_minutes,
    revenue,
    fuel_cost,
    other_costs,
    status,
    started_at,
    completed_at
)
VALUES (
    1,
    1,
    'Stara Zagora',
    'Sofia',
    CURRENT_DATE - INTERVAL '6 days',
    232,
    140,
    320,
    58,
    20,
    'completed',
    CURRENT_TIMESTAMP - INTERVAL '6 days 3 hours',
    CURRENT_TIMESTAMP - INTERVAL '6 days 40 minutes'
);


-- Completed trip
INSERT INTO trips (
    driver_id,
    vehicle_id,
    origin,
    destination,
    trip_date,
    distance_km,
    duration_minutes,
    revenue,
    fuel_cost,
    other_costs,
    status,
    started_at,
    completed_at
)
VALUES (
    2,
    2,
    'Plovdiv',
    'Burgas',
    CURRENT_DATE - INTERVAL '4 days',
    250,
    155,
    360,
    62,
    25,
    'completed',
    CURRENT_TIMESTAMP - INTERVAL '4 days 3 hours',
    CURRENT_TIMESTAMP - INTERVAL '4 days 20 minutes'
);


-- Completed trip
INSERT INTO trips (
    driver_id,
    vehicle_id,
    origin,
    destination,
    trip_date,
    distance_km,
    duration_minutes,
    revenue,
    fuel_cost,
    other_costs,
    status,
    started_at,
    completed_at
)
VALUES (
    3,
    3,
    'Stara Zagora',
    'Varna',
    CURRENT_DATE - INTERVAL '2 days',
    290,
    190,
    430,
    78,
    30,
    'completed',
    CURRENT_TIMESTAMP - INTERVAL '2 days 4 hours',
    CURRENT_TIMESTAMP - INTERVAL '2 days 35 minutes'
);


-- Active trip
INSERT INTO trips (
    driver_id,
    vehicle_id,
    origin,
    destination,
    trip_date,
    distance_km,
    duration_minutes,
    revenue,
    fuel_cost,
    other_costs,
    status,
    started_at
)
VALUES (
    1,
    1,
    'Stara Zagora',
    'Plovdiv',
    CURRENT_DATE,
    92,
    65,
    160,
    24,
    10,
    'in_progress',
    CURRENT_TIMESTAMP - INTERVAL '45 minutes'
);


-- Planned trip
INSERT INTO trips (
    driver_id,
    vehicle_id,
    origin,
    destination,
    trip_date,
    distance_km,
    duration_minutes,
    revenue,
    fuel_cost,
    other_costs,
    status
)
VALUES (
    2,
    2,
    'Stara Zagora',
    'Haskovo',
    CURRENT_DATE + INTERVAL '1 day',
    96,
    70,
    175,
    25,
    8,
    'planned'
);


-- Cancelled trip
INSERT INTO trips (
    driver_id,
    vehicle_id,
    origin,
    destination,
    trip_date,
    distance_km,
    duration_minutes,
    revenue,
    fuel_cost,
    other_costs,
    status,
    cancelled_at,
    cancellation_note
)
VALUES (
    3,
    3,
    'Sofia',
    'Pleven',
    CURRENT_DATE - INTERVAL '1 day',
    165,
    120,
    240,
    42,
    15,
    'cancelled',
    CURRENT_TIMESTAMP - INTERVAL '1 day',
    'Customer cancelled the transport request'
);