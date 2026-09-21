INSERT INTO drivers (
    first_name,
    last_name,
    phone
)
VALUES
    ('Ivan', 'Petrov', '+359888111111'),
    ('Georgi', 'Ivanov', '+359888222222'),
    ('Martin', 'Dimitrov', '+359888333333');


INSERT INTO vehicles (
    registration_number,
    make,
    model,
    fuel_type,
    average_consumption
)
VALUES
    ('CA1234AB', 'Volvo', 'FH', 'Diesel', 28.5),
    ('CB5678CD', 'Scania', 'R450', 'Diesel', 29.2),
    ('CT9012EF', 'Mercedes-Benz', 'Actros', 'Diesel', 27.8);


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
VALUES

(
    (SELECT id FROM drivers WHERE first_name = 'Ivan' AND last_name = 'Petrov' LIMIT 1),
    (SELECT id FROM vehicles WHERE registration_number = 'CA1234AB'),
    'Stara Zagora',
    'Sofia',
    '2026-08-12',
    232,
    137,
    450,
    102.49,
    30,
    'completed'
),

(
    (SELECT id FROM drivers WHERE first_name = 'Georgi' AND last_name = 'Ivanov' LIMIT 1),
    (SELECT id FROM vehicles WHERE registration_number = 'CB5678CD'),
    'Plovdiv',
    'Burgas',
    '2026-08-20',
    253,
    155,
    520,
    118.40,
    45,
    'completed'
),

(
    (SELECT id FROM drivers WHERE first_name = 'Martin' AND last_name = 'Dimitrov' LIMIT 1),
    (SELECT id FROM vehicles WHERE registration_number = 'CT9012EF'),
    'Sofia',
    'Varna',
    '2026-09-05',
    441,
    300,
    820,
    190.30,
    70,
    'completed'
),

(
    (SELECT id FROM drivers WHERE first_name = 'Ivan' AND last_name = 'Petrov' LIMIT 1),
    (SELECT id FROM vehicles WHERE registration_number = 'CA1234AB'),
    'Stara Zagora',
    'Plovdiv',
    '2026-09-10',
    92,
    65,
    260,
    40.65,
    20,
    'completed'
),

(
    (SELECT id FROM drivers WHERE first_name = 'Georgi' AND last_name = 'Ivanov' LIMIT 1),
    (SELECT id FROM vehicles WHERE registration_number = 'CB5678CD'),
    'Sofia',
    'Thessaloniki',
    '2026-09-25',
    295,
    210,
    650,
    133.60,
    60,
    'planned'
),

(
    (SELECT id FROM drivers WHERE first_name = 'Martin' AND last_name = 'Dimitrov' LIMIT 1),
    (SELECT id FROM vehicles WHERE registration_number = 'CT9012EF'),
    'Plovdiv',
    'Sofia',
    '2026-09-15',
    145,
    100,
    350,
    62.10,
    20,
    'cancelled'
);