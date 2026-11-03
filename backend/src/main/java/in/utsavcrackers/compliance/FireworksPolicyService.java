package in.utsavcrackers.compliance;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional(readOnly = true)
public class FireworksPolicyService {

    private final FireworksPolicyRepository policies;

    public FireworksPolicyService(FireworksPolicyRepository policies) {
        this.policies = policies;
    }

    public List<FireworksPolicyResponse> list() {
        return policies.findAllByOrderByCreatedAtDesc().stream()
                .map(FireworksPolicyResponse::from)
                .toList();
    }

    @Transactional
    public FireworksPolicyResponse create(String actorSubject, FireworksPolicyRequest request) {
        requireActor(actorSubject);
        if (request.effectiveUntil() != null && !request.effectiveUntil().isAfter(request.effectiveFrom())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Policy end time must be later than its start time");
        }
        FireworksJurisdictionPolicy policy = new FireworksJurisdictionPolicy(request, actorSubject);
        return FireworksPolicyResponse.from(policies.save(policy));
    }

    @Transactional
    public FireworksPolicyResponse approve(String reviewerSubject, UUID id) {
        requireActor(reviewerSubject);
        FireworksJurisdictionPolicy policy = find(id);
        List<FireworksJurisdictionPolicy> existing = policies.findAllByScopeKeyAndStatus(
                policy.getScopeKey(), PolicyStatus.APPROVED);
        boolean overlaps = existing.stream().anyMatch(other -> overlaps(
                policy.getEffectiveFrom(), policy.getEffectiveUntil(),
                other.getEffectiveFrom(), other.getEffectiveUntil()));
        if (overlaps) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "An approved policy already covers this jurisdiction and effective period");
        }
        policy.approve(reviewerSubject);
        return FireworksPolicyResponse.from(policy);
    }

    @Transactional
    public FireworksPolicyResponse revoke(String actorSubject, UUID id, String reason) {
        requireActor(actorSubject);
        FireworksJurisdictionPolicy policy = find(id);
        policy.revoke(actorSubject, reason);
        return FireworksPolicyResponse.from(policy);
    }

    private boolean overlaps(Instant startA, Instant endA, Instant startB, Instant endB) {
        boolean aEndsAfterBStarts = endA == null || endA.isAfter(startB);
        boolean bEndsAfterAStarts = endB == null || endB.isAfter(startA);
        return aEndsAfterBStarts && bEndsAfterAStarts;
    }

    private FireworksJurisdictionPolicy find(UUID id) {
        return policies.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Policy not found"));
    }

    private void requireActor(String actorSubject) {
        if (actorSubject == null || actorSubject.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "A signed-in administrator is required");
        }
    }
}
