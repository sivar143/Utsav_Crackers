package in.utsavcrackers.payment;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/customer/payments")
public class CustomerPaymentController {
    private final CustomerPaymentService service;

    public CustomerPaymentController(CustomerPaymentService service) {
        this.service = service;
    }

    @PostMapping("/orders")
    public PaymentOrderResponse createOrder(@AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody CreatePaymentOrderRequest request) {
        return service.createOrder(jwt.getSubject(), jwt.getClaimAsString("name"),
                jwt.getClaimAsString("email"), jwt.getClaimAsString("phone_number"), request);
    }

    @PostMapping("/verify")
    public PaymentVerificationResponse verify(@AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody VerifyPaymentRequest request) {
        return service.verifyPayment(jwt.getSubject(), request);
    }

    @PostMapping("/webhook")
    public ResponseEntity<Void> webhook(@RequestBody String payload,
            @RequestHeader(name = "X-Razorpay-Signature", required = false) String signature) {
        service.handleWebhook(payload, signature);
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }
}
