package in.utsavcrackers.compliance;

import java.time.Instant;
import java.util.Locale;
import java.util.UUID;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

@Entity
@Table(name = "fireworks_jurisdiction_policies", uniqueConstraints = {
        @UniqueConstraint(name = "uk_fireworks_policy_scope_start", columnNames = {"scope_key", "effective_from"})
})
public class FireworksJurisdictionPolicy {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(length = 36, nullable = false, updatable = false)
    private UUID id;

    @Column(name = "scope_key", nullable = false, length = 240)
    private String scopeKey;

    @Column(name = "state_code", nullable = false, length = 10)
    private String stateCode;

    @Column(length = 100)
    private String district;

    @Column(name = "postal_code", length = 10)
    private String postalCode;

    @Column(name = "sale_allowed", nullable = false)
    private boolean saleAllowed;

    @Column(name = "delivery_allowed", nullable = false)
    private boolean deliveryAllowed;

    @Column(name = "transport_allowed", nullable = false)
    private boolean transportAllowed;

    @Column(name = "storage_allowed", nullable = false)
    private boolean storageAllowed;

    @Column(name = "effective_from", nullable = false)
    private Instant effectiveFrom;

    @Column(name = "effective_until")
    private Instant effectiveUntil;

    @Column(name = "source_reference", nullable = false, length = 500)
    private String sourceReference;

    @Column(name = "legal_notes", nullable = false, length = 2000)
    private String legalNotes;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private PolicyStatus status;

    @Column(name = "created_by", nullable = false, length = 255, updatable = false)
    private String createdBy;

    @Column(name = "reviewed_by", length = 255)
    private String reviewedBy;

    @Column(name = "reviewed_at")
    private Instant reviewedAt;

    @Column(name = "revoked_by", length = 255)
    private String revokedBy;

    @Column(name = "revoked_at")
    private Instant revokedAt;

    @Column(name = "revocation_reason", length = 500)
    private String revocationReason;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected FireworksJurisdictionPolicy() {
    }

    public FireworksJurisdictionPolicy(FireworksPolicyRequest request, String createdBy) {
        this.stateCode = request.stateCode().trim().toUpperCase(Locale.ROOT);
        this.district = normalizeOptional(request.district());
        this.postalCode = normalizeOptional(request.postalCode());
        this.scopeKey = buildScopeKey(stateCode, district, postalCode);
        this.saleAllowed = request.saleAllowed();
        this.deliveryAllowed = request.deliveryAllowed();
        this.transportAllowed = request.transportAllowed();
        this.storageAllowed = request.storageAllowed();
        this.effectiveFrom = request.effectiveFrom();
        this.effectiveUntil = request.effectiveUntil();
        this.sourceReference = request.sourceReference().trim();
        this.legalNotes = request.legalNotes().trim();
        this.status = PolicyStatus.DRAFT;
        this.createdBy = createdBy;
    }

    public void approve(String reviewerSubject) {
        if (status != PolicyStatus.DRAFT) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Only draft policies can be approved");
        }
        if (createdBy.equals(reviewerSubject)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "A different administrator must review and approve this policy");
        }
        this.status = PolicyStatus.APPROVED;
        this.reviewedBy = reviewerSubject;
        this.reviewedAt = Instant.now();
    }

    public void revoke(String actorSubject, String reason) {
        if (status != PolicyStatus.APPROVED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Only approved policies can be revoked");
        }
        this.status = PolicyStatus.REVOKED;
        this.revokedBy = actorSubject;
        this.revokedAt = Instant.now();
        this.revocationReason = reason.trim();
    }

    public boolean isEffectiveAt(Instant instant) {
        return status == PolicyStatus.APPROVED
                && !effectiveFrom.isAfter(instant)
                && (effectiveUntil == null || effectiveUntil.isAfter(instant));
    }

    public String getScopeType() {
        if (postalCode != null) return "PIN_CODE";
        if (district != null) return "DISTRICT";
        return "STATE";
    }

    static String buildScopeKey(String stateCode, String district, String postalCode) {
        if (postalCode != null) {
            return stateCode + "|*|" + postalCode;
        }
        if (district != null) {
            return stateCode + "|" + district.toLowerCase(Locale.ROOT) + "|*";
        }
        return stateCode + "|*|*";
    }

    private String normalizeOptional(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    public UUID getId() { return id; }
    public String getScopeKey() { return scopeKey; }
    public String getStateCode() { return stateCode; }
    public String getDistrict() { return district; }
    public String getPostalCode() { return postalCode; }
    public boolean isSaleAllowed() { return saleAllowed; }
    public boolean isDeliveryAllowed() { return deliveryAllowed; }
    public boolean isTransportAllowed() { return transportAllowed; }
    public boolean isStorageAllowed() { return storageAllowed; }
    public Instant getEffectiveFrom() { return effectiveFrom; }
    public Instant getEffectiveUntil() { return effectiveUntil; }
    public String getSourceReference() { return sourceReference; }
    public String getLegalNotes() { return legalNotes; }
    public PolicyStatus getStatus() { return status; }
    public String getCreatedBy() { return createdBy; }
    public String getReviewedBy() { return reviewedBy; }
    public Instant getReviewedAt() { return reviewedAt; }
    public String getRevokedBy() { return revokedBy; }
    public Instant getRevokedAt() { return revokedAt; }
    public String getRevocationReason() { return revocationReason; }
    public Instant getCreatedAt() { return createdAt; }
}
