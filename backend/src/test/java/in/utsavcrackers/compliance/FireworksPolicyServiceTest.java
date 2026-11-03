package in.utsavcrackers.compliance;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class FireworksPolicyServiceTest {

    @Mock
    private FireworksPolicyRepository policies;

    private FireworksPolicyService service;
    private FireworksPolicyRequest request;

    @BeforeEach
    void setUp() {
        service = new FireworksPolicyService(policies);
        request = new FireworksPolicyRequest("IN-AP", "East Godavari", null,
                true, true, true, true, Instant.parse("2026-01-01T00:00:00Z"),
                null, "Government order reference", "Reviewed legal basis");
    }

    @Test
    void newlyCreatedPolicyRemainsDraftUntilASecondAdministratorApprovesIt() {
        when(policies.save(org.mockito.ArgumentMatchers.any(FireworksJurisdictionPolicy.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        FireworksPolicyResponse response = service.create("admin-one", request);

        assertThat(response.status()).isEqualTo(PolicyStatus.DRAFT);
        assertThat(response.createdBy()).isEqualTo("admin-one");
        assertThat(response.scopeType()).isEqualTo("DISTRICT");
    }

    @Test
    void creatorCannotApproveTheirOwnPolicy() {
        FireworksJurisdictionPolicy policy = new FireworksJurisdictionPolicy(request, "admin-one");
        UUID id = UUID.randomUUID();
        when(policies.findById(id)).thenReturn(Optional.of(policy));

        assertThatThrownBy(() -> service.approve("admin-one", id))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("403 FORBIDDEN");
    }

    @Test
    void differentAdministratorCanApproveNonOverlappingPolicy() {
        FireworksJurisdictionPolicy policy = new FireworksJurisdictionPolicy(request, "admin-one");
        UUID id = UUID.randomUUID();
        when(policies.findById(id)).thenReturn(Optional.of(policy));
        when(policies.findAllByScopeKeyAndStatus(policy.getScopeKey(), PolicyStatus.APPROVED))
                .thenReturn(List.of());

        FireworksPolicyResponse response = service.approve("admin-two", id);

        assertThat(response.status()).isEqualTo(PolicyStatus.APPROVED);
        assertThat(response.reviewedBy()).isEqualTo("admin-two");
        assertThat(response.reviewedAt()).isNotNull();
    }

    @Test
    void rejectsOverlappingApprovedPolicyForTheSameScope() {
        FireworksJurisdictionPolicy draft = new FireworksJurisdictionPolicy(request, "admin-one");
        FireworksJurisdictionPolicy existing = new FireworksJurisdictionPolicy(request, "admin-three");
        existing.approve("admin-four");
        UUID id = UUID.randomUUID();
        when(policies.findById(id)).thenReturn(Optional.of(draft));
        when(policies.findAllByScopeKeyAndStatus(draft.getScopeKey(), PolicyStatus.APPROVED))
                .thenReturn(List.of(existing));

        assertThatThrownBy(() -> service.approve("admin-two", id))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("409 CONFLICT");
    }
}
