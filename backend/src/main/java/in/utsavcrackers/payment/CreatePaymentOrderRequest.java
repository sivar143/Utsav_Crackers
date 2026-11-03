package in.utsavcrackers.payment;

import java.util.UUID;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

public record CreatePaymentOrderRequest(
        @NotNull UUID addressId,
        @NotBlank @Pattern(regexp = "UPI|CARD") String paymentMethod) {}
