CREATE TABLE shopping_carts (
    id VARCHAR(36) NOT NULL,
    customer_subject VARCHAR(255) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_shopping_carts_customer UNIQUE (customer_subject)
);

CREATE TABLE shopping_cart_items (
    id VARCHAR(36) NOT NULL,
    cart_id VARCHAR(36) NOT NULL,
    product_id VARCHAR(36) NOT NULL,
    quantity INT NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_cart_item_product UNIQUE (cart_id, product_id),
    CONSTRAINT fk_cart_items_cart FOREIGN KEY (cart_id) REFERENCES shopping_carts (id) ON DELETE CASCADE,
    CONSTRAINT fk_cart_items_product FOREIGN KEY (product_id) REFERENCES products (id),
    CONSTRAINT chk_cart_item_quantity CHECK (quantity BETWEEN 1 AND 99)
);

CREATE INDEX idx_cart_items_product ON shopping_cart_items (product_id);
