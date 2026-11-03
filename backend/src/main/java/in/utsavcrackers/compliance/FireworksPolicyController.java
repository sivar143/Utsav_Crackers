package in.utsavcrackers.compliance;

import java.util.List;
import java.util.UUID;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/compliance/policies")
public class FireworksPolicyController {

    private final FireworksPolicyService service;

    public FireworksPolicyController(FireworksPolicyService service) {
        this.service = service;
    }

    @GetMapping
    public List<FireworksPolicyResponse> list() {
        return service.list();
    }

    @PostMapping
    public ResponseEntity<FireworksPolicyResponse> create(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody FireworksPolicyRequest request) {
        return ResponseEntity.ok(service.create(jwt.getSubject(), request));
    }

    @PutMapping("/{id}/approve")
    public FireworksPolicyResponse approve(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id) {
        return service.approve(jwt.getSubject(), id);
    }

    @PutMapping("/{id}/revoke")
    public FireworksPolicyResponse revoke(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID id,
            @Valid @RequestBody FireworksPolicyRevokeRequest request) {
        return service.revoke(jwt.getSubject(), id, request.reason());
    }
}
