package in.utsavcrackers.compliance;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;
import static org.mockito.ArgumentMatchers.eq;

import in.utsavcrackers.customer.CustomerAddress;
import in.utsavcrackers.customer.CustomerAddressRepository;
import in.utsavcrackers.customer.CustomerAddressRequest;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class FireworksEligibilityServiceTest {

    @Mock
    private CustomerAddressRepository addresses;

    @Mock
    private FireworksPolicyRepository policies;

    private FireworksEligibilityService service;
    private UUID addressId;

    @BeforeEach
    void setUp() {
        service = new FireworksEligibilityService(addresses, policies);
        addressId = UUID.randomUUID();
        CustomerAddress address = new CustomerAddress("customer-subject",
                new CustomerAddressRequest("Home", "Customer", "+919876543210",
                        "12 Main Road", null, null, "Rajamahendravaram", "East Godavari",
                        "IN-AP", "533001", "IN"), true);
        when(addresses.findByIdAndCustomerSubject(addressId, "customer-subject"))
                .thenReturn(Optional.of(address));
    }

    @Test
    void blocksCheckoutWhenNoApprovedJurisdictionPolicyExists() {
        when(policies.findEffective("IN-AP|*|533001", eq(PolicyStatus.APPROVED), org.mockito.ArgumentMatchers.any()))
                .thenReturn(java.util.List.of());
        when(policies.findEffective("IN-AP|east godavari|*", eq(PolicyStatus.APPROVED), org.mockito.ArgumentMatchers.any()))
                .thenReturn(java.util.List.of());
        when(policies.findEffective("IN-AP|*|*", eq(PolicyStatus.APPROVED), org.mockito.ArgumentMatchers.any()))
                .thenReturn(java.util.List.of());

        FireworksEligibilityResponse response = service.check("customer-subject", addressId);

        assertThat(response.policyFound()).isFalse();
        assertThat(response.eligibleForCheckout()).isFalse();
        assertThat(response.saleAllowed()).isFalse();
    }

    @Test
    void usesTheMostSpecificApprovedPolicy() {
        FireworksJurisdictionPolicy districtPolicy = new FireworksJurisdictionPolicy(
                new FireworksPolicyRequest("IN-AP", "East Godavari", null,
                        true, true, true, false, Instant.parse("2026-01-01T00:00:00Z"),
                        null, "Official order", "Policy notes"), "admin-one");
        districtPolicy.approve("admin-two");
        when(policies.findEffective("IN-AP|*|533001", eq(PolicyStatus.APPROVED), org.mockito.ArgumentMatchers.any()))
                .thenReturn(java.util.List.of());
        when(policies.findEffective("IN-AP|east godavari|*", eq(PolicyStatus.APPROVED), org.mockito.ArgumentMatchers.any()))
                .thenReturn(java.util.List.of(districtPolicy));

        FireworksEligibilityResponse response = service.check("customer-subject", addressId);

        assertThat(response.policyFound()).isTrue();
        assertThat(response.policyScope()).isEqualTo("DISTRICT");
        assertThat(response.eligibleForCheckout()).isTrue();
        assertThat(response.storageAllowed()).isFalse();
    }
}
