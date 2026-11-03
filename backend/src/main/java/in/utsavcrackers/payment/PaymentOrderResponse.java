package in.utsavcrackers.payment;

import java.util.UUID;

public record PaymentOrderResponse(
        UUID orderId, String razorpayOrderId, int amount, String currency, String keyId,
        String customerName, String customerEmail, String customerPhone) {}
