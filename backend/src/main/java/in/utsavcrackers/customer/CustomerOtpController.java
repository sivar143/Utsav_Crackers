package in.utsavcrackers.customer;

import java.util.Map;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth/customer/otp")
public class CustomerOtpController {
    private final CustomerOtpService service;

    public CustomerOtpController(CustomerOtpService service) {
        this.service = service;
    }

    @PostMapping("/start")
    public Map<String, Object> start(@Valid @RequestBody OtpStartRequest request) {
        service.start(request);
        return Map.of("message", "A verification code has been sent if delivery is configured.", "expiresInSeconds", 300);
    }

    @PostMapping("/verify")
    public Map<String, Object> verify(@Valid @RequestBody OtpVerifyRequest request) {
        return service.verify(request);
    }
}
