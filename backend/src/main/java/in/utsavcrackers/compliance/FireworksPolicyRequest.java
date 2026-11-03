package in.utsavcrackers.compliance;

import java.time.Instant;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record FireworksPolicyRequest(
        @NotBlank @Pattern(regexp = "IN-[A-Z]{2}") String stateCode,
        @Size(max = 100) String district,
        @Pattern(regexp = "[0-9]{6}") String postalCode,
        boolean saleAllowed,
        boolean deliveryAllowed,
        boolean transportAllowed,
        boolean storageAllowed,
        @NotNull Instant effectiveFrom,
        Instant effectiveUntil,
        @NotBlank @Size(max = 500) String sourceReference,
        @NotBlank @Size(max = 2000) String legalNotes) {
}
