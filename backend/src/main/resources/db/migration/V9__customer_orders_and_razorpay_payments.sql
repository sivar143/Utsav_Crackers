CREATE TABLE customer_orders (
    id VARCHAR(36) NOT NULL,
    customer_subject VARCHAR(255) NOT NULL,
    delivery_address_snapshot VARCHAR(1200) NOT NULL,
    items_snapshot LONGTEXT NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    payment_method VARCHAR(12) NOT NULL,
    payment_status VARCHAR(24) NOT NULL DEFAULT 'PENDING',
    razorpay_order_id VARCHAR(64) NULL,
    razorpay_payment_id VARCHAR(64) NULL,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    paid_at TIMESTAMP(6) NULL,
    updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    CONSTRAINT uk_customer_orders_razorpay_order UNIQUE (razorpay_order_id),
    CONSTRAINT uk_customer_orders_razorpay_payment UNIQUE (razorpay_payment_id),
    CONSTRAINT chk_customer_orders_amount CHECK (amount > 0),
    CONSTRAINT chk_customer_orders_method CHECK (payment_method IN ('UPI', 'CARD')),
    CONSTRAINT chk_customer_orders_status CHECK (payment_status IN ('PENDING', 'PAID', 'FAILED'))
);
CREATE INDEX idx_customer_orders_customer_created ON customer_orders (customer_subject, created_at);
