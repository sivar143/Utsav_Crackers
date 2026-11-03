package in.utsavcrackers.compliance;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface FireworksPolicyRepository extends JpaRepository<FireworksJurisdictionPolicy, UUID> {

    List<FireworksJurisdictionPolicy> findAllByOrderByCreatedAtDesc();

    List<FireworksJurisdictionPolicy> findAllByScopeKeyAndStatus(String scopeKey, PolicyStatus status);

    @Query("""
            select policy from FireworksJurisdictionPolicy policy
            where policy.scopeKey = :scopeKey
              and policy.status = in.utsavcrackers.compliance.PolicyStatus.APPROVED
              and policy.effectiveFrom <= :at
              and (policy.effectiveUntil is null or policy.effectiveUntil > :at)
            order by policy.effectiveFrom desc
            """)
    List<FireworksJurisdictionPolicy> findEffective(
            @Param("scopeKey") String scopeKey, @Param("at") java.time.Instant at);
}
