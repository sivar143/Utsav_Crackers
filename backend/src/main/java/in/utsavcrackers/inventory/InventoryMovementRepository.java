package in.utsavcrackers.inventory;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InventoryMovementRepository extends JpaRepository<InventoryMovement, UUID> {

    @EntityGraph(attributePaths = "product")
    List<InventoryMovement> findAllByProduct_IdOrderByCreatedAtDesc(UUID productId);
}
