package in.utsavcrackers.compliance;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record FireworksPolicyRevokeRequest(
        @NotBlank @Size(max = 500) String reason) {
}
