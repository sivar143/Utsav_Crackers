package in.utsavcrackers.inventory;

import in.utsavcrackers.catalogue.Product;
import in.utsavcrackers.catalogue.ProductRepository;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional(readOnly = true)
public class InventoryService {

    private final ProductRepository products;
    private final InventoryBalanceRepository balances;
    private final InventoryMovementRepository movements;

    public InventoryService(ProductRepository products, InventoryBalanceRepository balances,
            InventoryMovementRepository movements) {
        this.products = products;
        this.balances = balances;
        this.movements = movements;
    }

    public List<InventoryBalanceResponse> listBalances() {
        return products.findAllByActiveTrueOrderByNameAsc().stream()
                .map(product -> InventoryBalanceResponse.from(product,
                        balances.findByProduct_Id(product.getId()).orElse(null)))
                .toList();
    }

    public List<InventoryMovementResponse> listMovements(UUID productId) {
        return movements.findAllByProduct_IdOrderByCreatedAtDesc(productId).stream()
                .map(InventoryMovementResponse::from)
                .toList();
    }

    @Transactional
    public InventoryBalanceResponse adjust(String actorSubject, UUID productId,
            InventoryAdjustmentRequest request) {
        if (actorSubject == null || actorSubject.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "A signed-in administrator is required");
        }
        int delta = request.quantityDelta();
        if (delta == 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Inventory adjustment cannot be zero");
        }

        // Lock the product row before creating or changing its single inventory balance.
        Product product = products.findActiveByIdForUpdate(productId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Active product not found"));
        InventoryBalance balance = balances.findByProductIdForUpdate(productId)
                .orElseGet(() -> new InventoryBalance(product));
        balance.adjustOnHand(delta);
        InventoryBalance saved = balances.save(balance);
        movements.save(new InventoryMovement(product, delta, saved.getOnHandQuantity(),
                saved.getReservedQuantity(), request.reason().trim(), actorSubject));
        return InventoryBalanceResponse.from(product, saved);
    }
}
