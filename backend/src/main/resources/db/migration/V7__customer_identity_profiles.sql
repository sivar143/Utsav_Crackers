CREATE TABLE customer_profiles (
    id VARCHAR(36) NOT NULL,
    keycloak_subject VARCHAR(255) NOT NULL,
    email VARCHAR(254) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NULL,
    phone_number VARCHAR(20) NOT NULL,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    CONSTRAINT uk_customer_profiles_keycloak_subject UNIQUE (keycloak_subject),
    CONSTRAINT uk_customer_profiles_email UNIQUE (email)
);
