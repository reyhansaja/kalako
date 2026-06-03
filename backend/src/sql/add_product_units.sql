-- Migration: Add product_units table for managing product units per client

CREATE TABLE IF NOT EXISTS product_units (
    id BIGINT NOT NULL AUTO_INCREMENT,
    client_id BIGINT NOT NULL,
    name VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY product_units_unique_name_per_client (client_id, name),
    KEY idx_product_units_client_id (client_id),
    CONSTRAINT product_units_client_id_fk
        FOREIGN KEY (client_id) REFERENCES clients (id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO product_units (client_id, name)
SELECT c.id, u.name
FROM clients c
CROSS JOIN (
    SELECT 'PCS' AS name
    UNION ALL SELECT 'KG'
    UNION ALL SELECT 'Liter'
    UNION ALL SELECT 'Gram'
    UNION ALL SELECT 'Box'
    UNION ALL SELECT 'Dus'
    UNION ALL SELECT 'Karton'
) AS u;
