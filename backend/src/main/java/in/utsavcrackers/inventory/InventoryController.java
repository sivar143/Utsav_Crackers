package in.utsavcrackers.inventory;

import java.util.List;
import java.util.UUID;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/inventory")
public class InventoryController {

    private final InventoryService service;

    public InventoryController(InventoryService service) {
        this.service = service;
    }

    @GetMapping
    public List<InventoryBalanceResponse> list() {
        return service.listBalances();
    }

    @GetMapping("/{productId}/movements")
    public List<InventoryMovementResponse> movements(@PathVariable UUID productId) {
        return service.listMovements(productId);
    }

    @PostMapping("/{productId}/adjustments")
    public ResponseEntity<InventoryBalanceResponse> adjust(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID productId,
            @Valid @RequestBody InventoryAdjustmentRequest request) {
        return ResponseEntity.ok(service.adjust(jwt.getSubject(), productId, request));
    }
}
