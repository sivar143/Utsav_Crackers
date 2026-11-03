package in.utsavcrackers.inventory;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record InventoryAdjustmentRequest(
        @NotNull @Min(-1000000) @Max(1000000) Integer quantityDelta,
        @NotBlank @Size(max = 255) String reason) {
}
