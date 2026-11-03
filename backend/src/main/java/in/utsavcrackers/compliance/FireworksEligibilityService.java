package in.utsavcrackers.compliance;

import in.utsavcrackers.customer.CustomerAddress;
import in.utsavcrackers.customer.CustomerAddressRepository;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional(readOnly = true)
public class FireworksEligibilityService {

    private final CustomerAddressRepository addresses;
    private final FireworksPolicyRepository policies;

    public FireworksEligibilityService(CustomerAddressRepository addresses, FireworksPolicyRepository policies) {
        this.addresses = addresses;
        this.policies = policies;
    }

    public FireworksEligibilityResponse check(String customerSubject, UUID addressId) {
        if (customerSubject == null || customerSubject.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "A signed-in customer is required");
        }
        CustomerAddress address = addresses.findByIdAndCustomerSubject(addressId, customerSubject)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Address not found for the signed-in customer"));

        Instant now = Instant.now();
        FireworksJurisdictionPolicy policy = findEffectivePolicy(address, now);
        if (policy == null) {
            return new FireworksEligibilityResponse(addressId, false, false, false, false,
                    false, false, "NONE", null,
                    "No approved, effective fireworks policy is configured for this address. Checkout is blocked.");
        }

        boolean eligible = policy.isSaleAllowed() && policy.isDeliveryAllowed() && policy.isTransportAllowed();
        String reason = eligible
                ? "The configured jurisdiction policy permits sale, delivery and transport. Product-specific and carrier checks are still required."
                : "The configured jurisdiction policy blocks at least one required activity. Checkout is blocked.";
        return new FireworksEligibilityResponse(addressId, true, policy.isSaleAllowed(),
                policy.isDeliveryAllowed(), policy.isTransportAllowed(), policy.isStorageAllowed(),
                eligible, policy.getScopeType(), policy.getSourceReference(), reason);
    }

    private FireworksJurisdictionPolicy findEffectivePolicy(CustomerAddress address, Instant now) {
        String state = address.getStateCode().toUpperCase(Locale.ROOT);
        String district = address.getDistrict().trim().toLowerCase(Locale.ROOT);
        String pinScope = state + "|*|" + address.getPostalCode();
        String districtScope = state + "|" + district + "|*";
        String stateScope = state + "|*|*";

        for (String scope : List.of(pinScope, districtScope, stateScope)) {
            List<FireworksJurisdictionPolicy> matches = policies.findEffective(scope, now);
            if (!matches.isEmpty()) {
                return matches.get(0);
            }
        }
        return null;
    }
}
