package in.utsavcrackers.compliance;

import java.util.UUID;

public record FireworksEligibilityResponse(
        UUID addressId,
        boolean policyFound,
        boolean saleAllowed,
        boolean deliveryAllowed,
        boolean transportAllowed,
        boolean storageAllowed,
        boolean eligibleForCheckout,
        String policyScope,
        String sourceReference,
        String reason) {
}
