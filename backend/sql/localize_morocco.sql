-- Optional: localize demo regions to Moroccan cities
-- Run with: psql -U cap_ai_user -h localhost -d cap_ai -f backend/sql/localize_morocco.sql

UPDATE regions SET name = 'Casablanca' WHERE id = 1;
UPDATE regions SET name = 'Marrakech' WHERE id = 2;
UPDATE regions SET name = 'Fès' WHERE id = 3;
UPDATE regions SET name = 'Rabat' WHERE id = 4;
