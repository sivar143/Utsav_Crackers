package in.utsavcrackers.catalogue;

import java.math.BigDecimal;
import java.util.UUID;

public record ProductResponse(
        UUID id,
        String sku,
        String name,
        String description,
        UUID categoryId,
        String categoryName,
        BigDecimal price,
        String currency) {
}
