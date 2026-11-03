package in.utsavcrackers.customer;

import java.net.URI;
import java.util.List;
import java.util.UUID;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/customer/addresses")
public class CustomerAddressController {

    private final CustomerAddressService service;

    public CustomerAddressController(CustomerAddressService service) {
        this.service = service;
    }

    @GetMapping
    public List<CustomerAddressResponse> list(@AuthenticationPrincipal Jwt jwt) {
        return service.list(jwt.getSubject());
    }

    @PostMapping
    public ResponseEntity<CustomerAddressResponse> create(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody CustomerAddressRequest request) {
        CustomerAddressResponse response = service.create(jwt.getSubject(), request);
        return ResponseEntity.created(URI.create("/api/v1/customer/addresses/" + response.id())).body(response);
    }

    @PutMapping("/{id}")
    public CustomerAddressResponse update(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID id,
            @Valid @RequestBody CustomerAddressRequest request) {
        return service.update(jwt.getSubject(), id, request);
    }

    @PutMapping("/{id}/default")
    public CustomerAddressResponse makeDefault(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID id) {
        return service.makeDefault(jwt.getSubject(), id);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id) {
        service.delete(jwt.getSubject(), id);
        return ResponseEntity.noContent().build();
    }
}
