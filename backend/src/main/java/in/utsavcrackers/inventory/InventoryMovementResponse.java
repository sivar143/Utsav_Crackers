package in.utsavcrackers.inventory;

import java.time.Instant;
import java.util.UUID;

public record InventoryMovementResponse(
        UUID id,
        UUID productId,
        String movementType,
        int quantityDelta,
        int onHandAfter,
        int reservedAfter,
        String reason,
        String actorSubject,
        Instant createdAt) {

    static InventoryMovementResponse from(InventoryMovement movement) {
        return new InventoryMovementResponse(movement.getId(), movement.getProduct().getId(),
                movement.getMovementType().name(), movement.getQuantityDelta(),
                movement.getOnHandAfter(), movement.getReservedAfter(), movement.getReason(),
                movement.getActorSubject(), movement.getCreatedAt());
    }
}
