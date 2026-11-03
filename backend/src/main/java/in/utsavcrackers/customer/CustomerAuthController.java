package in.utsavcrackers.customer;

import java.net.URI;
import java.util.Map;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth/customer")
public class CustomerAuthController {
    private final CustomerIdentityService identity;

    public CustomerAuthController(CustomerIdentityService identity) {
        this.identity = identity;
    }

    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> register(@Valid @RequestBody CustomerRegistrationRequest request) {
        return ResponseEntity.created(URI.create("/api/v1/auth/customer/registration"))
                .body(identity.register(request));
    }

    @PostMapping("/login")
    public Map<String, Object> login(@Valid @RequestBody CustomerLoginRequest request) {
        return identity.login(request);
    }
}
