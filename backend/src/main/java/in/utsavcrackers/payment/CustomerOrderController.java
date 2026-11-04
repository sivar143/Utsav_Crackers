package in.utsavcrackers.payment;

import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/customer/orders")
public class CustomerOrderController {
    private final CustomerOrderService service;

    public CustomerOrderController(CustomerOrderService service) {
        this.service = service;
    }

    @PostMapping
    public CustomerOrderResponse placeOrder(@AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody CreateCustomerOrderRequest request) {
        return service.placeOrder(jwt.getSubject(), jwt.getClaimAsString("name"),
                jwt.getClaimAsString("email"), jwt.getClaimAsString("phone_number"), request);
    }
}
