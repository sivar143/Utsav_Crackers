package in.utsavcrackers.payment;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record AdminDeliveryResponse(
        UUID orderId,
        String customerSubject,
        String customerName,
        String customerEmail,
        String customerPhone,
        String deliveryAddress,
        String itemsSnapshot,
        BigDecimal amount,
        String currency,
        String paymentMethod,
        Instant orderedAt,
        String deliveryStatus) {
}
