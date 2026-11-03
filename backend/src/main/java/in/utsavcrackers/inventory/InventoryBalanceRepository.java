package in.utsavcrackers.inventory;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;

public interface InventoryBalanceRepository extends JpaRepository<InventoryBalance, UUID> {

    @EntityGraph(attributePaths = "product")
    Optional<InventoryBalance> findByProduct_Id(UUID productId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @EntityGraph(attributePaths = "product")
    @Query("select balance from InventoryBalance balance where balance.product.id = :productId")
    Optional<InventoryBalance> findByProductIdForUpdate(@Param("productId") UUID productId);

    @EntityGraph(attributePaths = "product")
    @Query("select balance from InventoryBalance balance order by balance.product.name")
    List<InventoryBalance> findAllWithProducts();
}
