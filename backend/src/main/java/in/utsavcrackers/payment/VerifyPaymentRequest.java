package in.utsavcrackers.payment;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record VerifyPaymentRequest(
        @NotBlank @Size(max = 64) String razorpayOrderId,
        @NotBlank @Size(max = 64) String razorpayPaymentId,
        @NotBlank @Size(max = 128) String razorpaySignature) {}
