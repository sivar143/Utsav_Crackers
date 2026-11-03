CREATE TABLE inventory_balances (
    id VARCHAR(36) NOT NULL,
    product_id VARCHAR(36) NOT NULL,
    on_hand_quantity INT NOT NULL DEFAULT 0,
    reserved_quantity INT NOT NULL DEFAULT 0,
    version BIGINT NOT NULL DEFAULT 0,
    updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    CONSTRAINT uk_inventory_balance_product UNIQUE (product_id),
    CONSTRAINT fk_inventory_balance_product FOREIGN KEY (product_id) REFERENCES products (id),
    CONSTRAINT chk_inventory_on_hand_nonnegative CHECK (on_hand_quantity >= 0),
    CONSTRAINT chk_inventory_reserved_nonnegative CHECK (reserved_quantity >= 0),
    CONSTRAINT chk_inventory_reserved_not_over_on_hand CHECK (reserved_quantity <= on_hand_quantity)
);

CREATE TABLE inventory_movements (
    id VARCHAR(36) NOT NULL,
    product_id VARCHAR(36) NOT NULL,
    movement_type VARCHAR(24) NOT NULL,
    quantity_delta INT NOT NULL,
    on_hand_after INT NOT NULL,
    reserved_after INT NOT NULL,
    reason VARCHAR(255) NOT NULL,
    actor_subject VARCHAR(255) NOT NULL,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    CONSTRAINT fk_inventory_movement_product FOREIGN KEY (product_id) REFERENCES products (id),
    INDEX idx_inventory_movements_product_created (product_id, created_at)
);
