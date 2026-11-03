ALTER TABLE customer_orders ADD COLUMN delivery_status VARCHAR(24) NOT NULL DEFAULT 'PENDING';
CREATE INDEX idx_customer_orders_delivery_queue ON customer_orders (payment_status, delivery_status, created_at);
