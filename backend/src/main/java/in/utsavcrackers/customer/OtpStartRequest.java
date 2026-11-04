package in.utsavcrackers.customer;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record OtpStartRequest(
        @NotBlank @Size(max = 254) String contact) {
}
