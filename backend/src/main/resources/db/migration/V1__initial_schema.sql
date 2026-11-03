-- Baseline schema marker. Domain tables are introduced in subsequent migrations.
CREATE TABLE schema_metadata (
    id BIGINT NOT NULL PRIMARY KEY,
    platform_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_schema_metadata_singleton CHECK (id = 1)
);

INSERT INTO schema_metadata (id, platform_name) VALUES (1, 'Utsav Crackers');
