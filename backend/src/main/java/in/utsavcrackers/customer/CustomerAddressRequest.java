package in.utsavcrackers.customer;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CustomerAddressRequest(
        @NotBlank @Size(max = 40) String label,
        @NotBlank @Size(max = 120) String recipientName,
        @NotBlank @Pattern(regexp = "\\+?[1-9][0-9]{7,14}", message = "Enter a valid international phone number") String phoneNumber,
        @NotBlank @Size(max = 180) String addressLine1,
        @Size(max = 180) String addressLine2,
        @Size(max = 180) String landmark,
        @NotBlank @Size(max = 100) String city,
        @NotBlank @Size(max = 100) String district,
        @NotBlank @Pattern(regexp = "IN-[A-Z]{2}", message = "Use an Indian state code such as IN-AP") String stateCode,
        @NotBlank @Pattern(regexp = "[0-9]{6}", message = "Enter a 6-digit Indian PIN code") String postalCode,
        @NotBlank @Pattern(regexp = "IN", message = "Only Indian delivery addresses are currently supported") String countryCode) {
}
