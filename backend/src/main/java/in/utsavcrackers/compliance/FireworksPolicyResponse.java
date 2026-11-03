package in.utsavcrackers.compliance;

import java.time.Instant;
import java.util.UUID;

public record FireworksPolicyResponse(
        UUID id,
        String scopeType,
        String stateCode,
        String district,
        String postalCode,
        boolean saleAllowed,
        boolean deliveryAllowed,
        boolean transportAllowed,
        boolean storageAllowed,
        Instant effectiveFrom,
        Instant effectiveUntil,
        String sourceReference,
        String legalNotes,
        PolicyStatus status,
        String createdBy,
        String reviewedBy,
        Instant reviewedAt,
        String revokedBy,
        Instant revokedAt,
        String revocationReason) {

    static FireworksPolicyResponse from(FireworksJurisdictionPolicy policy) {
        return new FireworksPolicyResponse(policy.getId(), policy.getScopeType(), policy.getStateCode(),
                policy.getDistrict(), policy.getPostalCode(), policy.isSaleAllowed(),
                policy.isDeliveryAllowed(), policy.isTransportAllowed(), policy.isStorageAllowed(),
                policy.getEffectiveFrom(), policy.getEffectiveUntil(), policy.getSourceReference(),
                policy.getLegalNotes(), policy.getStatus(), policy.getCreatedBy(),
                policy.getReviewedBy(), policy.getReviewedAt(), policy.getRevokedBy(),
                policy.getRevokedAt(), policy.getRevocationReason());
    }
}
