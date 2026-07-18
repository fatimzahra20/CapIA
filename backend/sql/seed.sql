INSERT INTO regions (name) VALUES
    ('Casablanca'),
    ('Marrakech'),
    ('Fès'),
    ('Rabat');

INSERT INTO products (name, category, unit_price) VALUES
    ('Ordinateur portable', 'Informatique', 8500.00),
    ('Souris sans fil', 'Accessoires', 250.00),
    ('Écran 27 pouces', 'Informatique', 3200.00),
    ('Clavier mécanique', 'Accessoires', 750.00);

INSERT INTO sales (sale_date, region_id, product_id, quantity, total_amount) VALUES
    ('2026-01-10', 1, 1, 3, 25500.00),
    ('2026-01-15', 2, 2, 10, 2500.00),
    ('2026-02-05', 1, 3, 2, 6400.00),
    ('2026-02-20', 3, 4, 5, 3750.00),
    ('2026-03-08', 4, 1, 1, 8500.00),
    ('2026-03-18', 2, 3, 4, 12800.00),
    ('2026-03-25', 3, 2, 8, 2000.00),
    ('2026-04-02', 1, 4, 6, 4500.00);
