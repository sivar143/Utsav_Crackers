package in.utsavcrackers.inventory;

import in.utsavcrackers.catalogue.Product;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "inventory_movements")
public class InventoryMovement {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(length = 36, nullable = false, updatable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Enumerated(EnumType.STRING)
    @Column(name = "movement_type", nullable = false, length = 24)
    private InventoryMovementType movementType;

    @Column(name = "quantity_delta", nullable = false)
    private int quantityDelta;

    @Column(name = "on_hand_after", nullable = false)
    private int onHandAfter;

    @Column(name = "reserved_after", nullable = false)
    private int reservedAfter;

    @Column(nullable = false, length = 255)
    private String reason;

    @Column(name = "actor_subject", nullable = false, length = 255)
    private String actorSubject;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected InventoryMovement() {
    }

    public InventoryMovement(Product product, int quantityDelta, int onHandAfter,
            int reservedAfter, String reason, String actorSubject) {
        this.product = product;
        this.movementType = InventoryMovementType.ADJUSTMENT;
        this.quantityDelta = quantityDelta;
        this.onHandAfter = onHandAfter;
        this.reservedAfter = reservedAfter;
        this.reason = reason;
        this.actorSubject = actorSubject;
    }

    public UUID getId() { return id; }
    public Product getProduct() { return product; }
    public InventoryMovementType getMovementType() { return movementType; }
    public int getQuantityDelta() { return quantityDelta; }
    public int getOnHandAfter() { return onHandAfter; }
    public int getReservedAfter() { return reservedAfter; }
    public String getReason() { return reason; }
    public String getActorSubject() { return actorSubject; }
    public Instant getCreatedAt() { return createdAt; }
}
