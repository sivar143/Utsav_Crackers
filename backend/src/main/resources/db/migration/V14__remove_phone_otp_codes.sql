-- Phone-based OTP is no longer supported. Invalidate any previously issued SMS codes.
DELETE FROM customer_login_otps WHERE channel = 'PHONE';
