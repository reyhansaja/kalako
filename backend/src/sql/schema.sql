-- MySQL schema for Kalako backend

CREATE TABLE IF NOT EXISTS clients (
  id BIGINT NOT NULL AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  owner_name VARCHAR(255) NOT NULL,
  owner_id_number VARCHAR(50) DEFAULT NULL,
  address TEXT,
  phone VARCHAR(30) NOT NULL,
  email VARCHAR(255) DEFAULT NULL,
  subdomain VARCHAR(100) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'trial',
  trial_ends_at DATETIME DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  city VARCHAR(100) DEFAULT NULL,
  district VARCHAR(100) DEFAULT NULL,
  sub_district VARCHAR(100) DEFAULT NULL,
  province VARCHAR(100) DEFAULT NULL,
  store_photo_url TEXT,
  suspended_at DATETIME DEFAULT NULL,
  suspension_reason VARCHAR(255) DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY clients_email_key (email),
  UNIQUE KEY clients_subdomain_key (subdomain)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS email_otp_codes (
  id BIGINT NOT NULL AUTO_INCREMENT,
  email VARCHAR(255) NOT NULL,
  otp VARCHAR(6) NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_email_otp_codes_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT NOT NULL AUTO_INCREMENT,
  client_id BIGINT DEFAULT NULL,
  name VARCHAR(255) NOT NULL,
  username VARCHAR(100) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(30) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY users_client_username_unique (client_id, username),
  KEY idx_users_client_id (client_id),
  CONSTRAINT users_client_id_fk FOREIGN KEY (client_id) REFERENCES clients (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS customers (
  id BIGINT NOT NULL AUTO_INCREMENT,
  client_id BIGINT DEFAULT NULL,
  name VARCHAR(150) DEFAULT NULL,
  phone VARCHAR(50) DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_customers_client_id (client_id),
  CONSTRAINT customers_client_id_fk FOREIGN KEY (client_id) REFERENCES clients (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS payments (
  id BIGINT NOT NULL AUTO_INCREMENT,
  client_id BIGINT DEFAULT NULL,
  subscription_id BIGINT DEFAULT NULL,
  amount DECIMAL(15,2) NOT NULL,
  payment_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  method VARCHAR(50) DEFAULT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'success',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  proof_url TEXT,
  proof_uploaded_at DATETIME DEFAULT NULL,
  reviewed_by BIGINT DEFAULT NULL,
  reviewed_at DATETIME DEFAULT NULL,
  review_note TEXT,
  PRIMARY KEY (id),
  KEY idx_payments_client_status (client_id, status),
  KEY idx_payments_reviewed_by (reviewed_by),
  CONSTRAINT payments_client_id_fk FOREIGN KEY (client_id) REFERENCES clients (id) ON DELETE CASCADE,
  CONSTRAINT payments_reviewed_by_fk FOREIGN KEY (reviewed_by) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS product_categories (
  id BIGINT NOT NULL AUTO_INCREMENT,
  client_id BIGINT DEFAULT NULL,
  name VARCHAR(100) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY product_categories_unique_name_per_client (client_id, name),
  KEY idx_product_categories_client_id (client_id),
  CONSTRAINT product_categories_client_id_fk FOREIGN KEY (client_id) REFERENCES clients (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS product_units (
  id BIGINT NOT NULL AUTO_INCREMENT,
  client_id BIGINT NOT NULL,
  name VARCHAR(50) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY product_units_unique_name_per_client (client_id, name),
  KEY idx_product_units_client_id (client_id),
  CONSTRAINT product_units_client_id_fk FOREIGN KEY (client_id) REFERENCES clients (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS products (
  id BIGINT NOT NULL AUTO_INCREMENT,
  client_id BIGINT DEFAULT NULL,
  name VARCHAR(150) NOT NULL,
  selling_price DECIMAL(15,2) NOT NULL DEFAULT 0,
  stock DECIMAL(15,3) NOT NULL DEFAULT 0,
  unit VARCHAR(20) NOT NULL DEFAULT 'PCS',
  category_id BIGINT DEFAULT NULL,
  expiry_date DATE DEFAULT NULL,
  last_out_at DATETIME DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_products_client_id (client_id),
  KEY idx_products_category_id (category_id),
  CONSTRAINT products_client_id_fk FOREIGN KEY (client_id) REFERENCES clients (id) ON DELETE CASCADE,
  CONSTRAINT products_category_id_fk FOREIGN KEY (category_id) REFERENCES product_categories (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS sales_transactions (
  id BIGINT NOT NULL AUTO_INCREMENT,
  invoice_code VARCHAR(50) UNIQUE,
  client_id BIGINT DEFAULT NULL,
  cashier_id BIGINT DEFAULT NULL,
  total_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  paid_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  change_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_sales_transactions_client_id (client_id),
  KEY idx_sales_transactions_cashier_id (cashier_id),
  KEY idx_sales_transactions_created_at (created_at),
  CONSTRAINT sales_transactions_client_id_fk FOREIGN KEY (client_id) REFERENCES clients (id) ON DELETE CASCADE,
  CONSTRAINT sales_transactions_cashier_id_fk FOREIGN KEY (cashier_id) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS sales_transaction_items (
  id BIGINT NOT NULL AUTO_INCREMENT,
  transaction_id BIGINT NOT NULL,
  product_id BIGINT NOT NULL,
  quantity DECIMAL(15,3) NOT NULL DEFAULT 0,
  unit_price DECIMAL(15,2) NOT NULL DEFAULT 0,
  subtotal DECIMAL(15,2) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_sales_transaction_items_transaction_id (transaction_id),
  KEY idx_sales_transaction_items_product_id (product_id),
  CONSTRAINT sales_transaction_items_transaction_id_fk FOREIGN KEY (transaction_id) REFERENCES sales_transactions (id) ON DELETE CASCADE,
  CONSTRAINT sales_transaction_items_product_id_fk FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
