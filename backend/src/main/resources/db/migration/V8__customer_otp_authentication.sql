ALTER TABLE customer_profiles
    MODIFY email VARCHAR(254) NULL,
    MODIFY phone_number VARCHAR(20) NULL;

CREATE TABLE customer_login_otps (
    id BIGINT NOT NULL AUTO_INCREMENT,
    channel VARCHAR(10) NOT NULL,
    contact VARCHAR(254) NOT NULL,
    code_hash CHAR(64) NOT NULL,
    expires_at TIMESTAMP(6) NOT NULL,
    attempts INT NOT NULL DEFAULT 0,
    consumed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    INDEX ix_customer_login_otps_contact_created (channel, contact, created_at),
    INDEX ix_customer_login_otps_expiry (expires_at)
);
