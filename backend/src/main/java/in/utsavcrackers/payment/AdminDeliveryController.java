package in.utsavcrackers.payment;

import java.util.List;
import java.util.Set;
import java.util.UUID;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/v1/admin/deliveries")
public class AdminDeliveryController {
    private static final Set<String> ALLOWED_STATUSES = Set.of("PENDING", "PACKED", "DISPATCHED", "DELIVERED");
    private final CustomerOrderRepository orders;

    public AdminDeliveryController(CustomerOrderRepository orders) {
        this.orders = orders;
    }

    @GetMapping
    @Transactional(readOnly = true)
    public List<AdminDeliveryResponse> listPaidOrders() {
        return orders.findAllByPaymentStatusOrderByCreatedAtDesc("PAID").stream()
                .map(order -> new AdminDeliveryResponse(order.getId(), order.getCustomerSubject(), order.getCustomerName(),
                        order.getCustomerEmail(), order.getCustomerPhone(), order.getDeliveryAddressSnapshot(), order.getItemsSnapshot(), order.getAmount(),
                        order.getCurrency(), order.getPaymentMethod(), order.getCreatedAt(),
                        order.getDeliveryStatus()))
                .toList();
    }

    @PutMapping("/{orderId}/status")
    @Transactional
    public AdminDeliveryResponse updateStatus(@PathVariable UUID orderId,
            @Valid @RequestBody UpdateDeliveryStatusRequest request) {
        if (!ALLOWED_STATUSES.contains(request.status())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported delivery status.");
        }
        CustomerOrder order = orders.findById(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found."));
        if (!"PAID".equals(order.getPaymentStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Only paid orders can enter the delivery queue.");
        }
        order.updateDeliveryStatus(request.status());
        return new AdminDeliveryResponse(order.getId(), order.getCustomerSubject(), order.getCustomerName(),
                order.getCustomerEmail(), order.getCustomerPhone(), order.getDeliveryAddressSnapshot(), order.getItemsSnapshot(), order.getAmount(),
                order.getCurrency(), order.getPaymentMethod(), order.getCreatedAt(),
                order.getDeliveryStatus());
    }

    public record UpdateDeliveryStatusRequest(
            @NotBlank @Pattern(regexp = "PENDING|PACKED|DISPATCHED|DELIVERED") String status) {
    }
}
