-- Migration: Add product_units table for managing product units per client

CREATE TABLE IF NOT EXISTS product_units (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    client_id BIGINT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (client_id, name)
);

CREATE INDEX IF NOT EXISTS idx_product_units_client_id ON product_units(client_id);

INSERT INTO product_units (client_id, name)
SELECT c.id, u.name
FROM clients c
CROSS JOIN (
    VALUES
      ('PCS'),
      ('KG'),
      ('Liter'),
      ('Gram'),
      ('Box'),
      ('Dus'),
      ('Karton')
) AS u(name)
ON CONFLICT DO NOTHING;
