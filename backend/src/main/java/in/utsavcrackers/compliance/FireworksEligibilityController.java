package in.utsavcrackers.compliance;

import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/customer/compliance")
public class FireworksEligibilityController {

    private final FireworksEligibilityService service;

    public FireworksEligibilityController(FireworksEligibilityService service) {
        this.service = service;
    }

    @PostMapping("/eligibility-check")
    public FireworksEligibilityResponse check(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody FireworksEligibilityRequest request) {
        return service.check(jwt.getSubject(), request.addressId());
    }
}
