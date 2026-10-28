-- Adapt sales table to the difficult_dataset (Sales, Cost, Profit, Region, Description)

ALTER TABLE sales ALTER COLUMN product_id DROP NOT NULL;
ALTER TABLE sales ALTER COLUMN quantity DROP NOT NULL;

ALTER TABLE sales ADD COLUMN IF NOT EXISTS cost NUMERIC(14, 2);
ALTER TABLE sales ADD COLUMN IF NOT EXISTS profit NUMERIC(14, 2);
ALTER TABLE sales ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS mixed_column VARCHAR(80);

ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(50) NOT NULL DEFAULT 'local';
