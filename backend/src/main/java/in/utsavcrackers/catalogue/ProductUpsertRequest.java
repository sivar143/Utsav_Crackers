package in.utsavcrackers.catalogue;

import java.math.BigDecimal;
import java.util.UUID;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ProductUpsertRequest(
        @NotBlank @Size(max = 64) String sku,
        @NotBlank @Size(max = 180) String name,
        @Size(max = 2000) String description,
        @Size(max = 1500000) String imageData,
        @NotNull UUID categoryId,
        @NotNull @DecimalMin("0.01") BigDecimal price,
        @NotBlank @Pattern(regexp = "[A-Z]{3}") String currency) {
    public ProductUpsertRequest(String sku, String name, String description, UUID categoryId,
            BigDecimal price, String currency) {
        this(sku, name, description, null, categoryId, price, currency);
    }
}
