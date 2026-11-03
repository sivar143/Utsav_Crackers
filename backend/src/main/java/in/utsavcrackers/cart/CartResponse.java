package in.utsavcrackers.cart;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record CartResponse(
        UUID id,
        List<CartLineResponse> items,
        int totalQuantity,
        BigDecimal subtotal,
        String currency) {

    public record CartLineResponse(
            UUID productId,
            String sku,
            String name,
            int quantity,
            BigDecimal unitPrice,
            BigDecimal lineTotal,
            String currency) {
    }
}
