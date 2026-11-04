-- Remove historical SMS codes and the now-unneeded channel discriminator.
DELETE FROM customer_login_otps WHERE channel = 'PHONE';

ALTER TABLE customer_login_otps
    DROP INDEX ix_customer_login_otps_contact_created,
    DROP COLUMN channel,
    ADD INDEX ix_customer_login_otps_contact_created (contact, created_at);
