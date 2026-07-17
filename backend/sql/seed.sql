INSERT INTO regions (name) VALUES
    ('Nord'),
    ('Sud'),
    ('Est'),
    ('Ouest');

INSERT INTO products (name, category, unit_price) VALUES
    ('Ordinateur portable', 'Informatique', 850.00),
    ('Souris sans fil', 'Accessoires', 25.00),
    ('Écran 27 pouces', 'Informatique', 320.00),
    ('Clavier mécanique', 'Accessoires', 75.00);

INSERT INTO sales (sale_date, region_id, product_id, quantity, total_amount) VALUES
    ('2026-01-10', 1, 1, 3, 2550.00),
    ('2026-01-15', 2, 2, 10, 250.00),
    ('2026-02-05', 1, 3, 2, 640.00),
    ('2026-02-20', 3, 4, 5, 375.00),
    ('2026-03-08', 4, 1, 1, 850.00),
    ('2026-03-18', 2, 3, 4, 1280.00),
    ('2026-03-25', 3, 2, 8, 200.00),
    ('2026-04-02', 1, 4, 6, 450.00);