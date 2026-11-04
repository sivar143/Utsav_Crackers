package in.utsavcrackers.customer;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record OtpVerifyRequest(
        @NotBlank @Size(max = 254) String contact,
        @NotBlank @Pattern(regexp = "^[0-9]{6}$") String code) {
}
