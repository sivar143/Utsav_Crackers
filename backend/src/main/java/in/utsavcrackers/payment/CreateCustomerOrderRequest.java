package in.utsavcrackers.payment;

import java.util.UUID;
import jakarta.validation.constraints.NotNull;

public record CreateCustomerOrderRequest(@NotNull UUID addressId) {
}
