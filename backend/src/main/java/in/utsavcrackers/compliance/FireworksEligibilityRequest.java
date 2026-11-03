package in.utsavcrackers.compliance;

import java.util.UUID;
import jakarta.validation.constraints.NotNull;

public record FireworksEligibilityRequest(@NotNull UUID addressId) {
}
