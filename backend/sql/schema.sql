CREATE TABLE IF NOT EXISTS regions (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS products (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    category VARCHAR(100) NOT NULL,
    unit_price NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0)
);

CREATE TABLE IF NOT EXISTS sales (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    sale_date DATE NOT NULL,
    region_id BIGINT NOT NULL REFERENCES regions(id),
    product_id BIGINT NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    total_amount NUMERIC(14, 2) NOT NULL CHECK (total_amount >= 0)
);

CREATE TABLE IF NOT EXISTS analysis_history (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    question TEXT NOT NULL,
    generated_sql TEXT,
    chart_type VARCHAR(50),
    interpretation TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(sale_date);
CREATE INDEX IF NOT EXISTS idx_sales_region ON sales(region_id);
CREATE INDEX IF NOT EXISTS idx_sales_product ON sales(product_id);