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

    @PostMapping("/refresh")
    public Map<String, Object> refresh(@RequestBody Map<String, String> request) {
        String refreshToken = request.get("refreshToken");
        if (refreshToken == null || refreshToken.isBlank()) {
            throw new org.springframework.web.server.ResponseStatusException(HttpStatus.BAD_REQUEST, "Refresh token is required");
        }
        return identity.refresh(refreshToken);
    }

    @PostMapping("/login")
    public Map<String, Object> login(@Valid @RequestBody CustomerLoginRequest request) {
        return identity.login(request);
    }
}
