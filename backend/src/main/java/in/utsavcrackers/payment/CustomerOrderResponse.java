package in.utsavcrackers.payment;

import java.math.BigDecimal;
import java.util.UUID;

public record CustomerOrderResponse(
        UUID orderId,
        BigDecimal amount,
        String currency,
        String paymentMethod,
        String message) {
}
