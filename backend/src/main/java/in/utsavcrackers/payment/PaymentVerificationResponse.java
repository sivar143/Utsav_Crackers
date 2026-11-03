package in.utsavcrackers.payment;

import java.util.UUID;

public record PaymentVerificationResponse(UUID orderId, String status, String message) {}
