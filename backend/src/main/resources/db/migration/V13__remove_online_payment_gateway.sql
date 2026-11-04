-- Keep historical UPI/CARD order records readable, but permit COD orders.
ALTER TABLE customer_orders
    DROP CHECK chk_customer_orders_method,
    ADD CONSTRAINT chk_customer_orders_method CHECK (payment_method IN ('UPI', 'CARD', 'COD'));

-- The previous migration is immutable for existing Flyway installations.
-- Remove the provider-specific columns and indexes in this forward migration.
ALTER TABLE customer_orders
    DROP INDEX uk_customer_orders_razorpay_order,
    DROP INDEX uk_customer_orders_razorpay_payment,
    DROP COLUMN razorpay_order_id,
    DROP COLUMN razorpay_payment_id;
