package in.utsavcrackers.customer;

import java.util.UUID;

public record CustomerAddressResponse(
        UUID id,
        String label,
        String recipientName,
        String phoneNumber,
        String addressLine1,
        String addressLine2,
        String landmark,
        String city,
        String district,
        String stateCode,
        String postalCode,
        String countryCode,
        boolean defaultAddress) {

    static CustomerAddressResponse from(CustomerAddress address) {
        return new CustomerAddressResponse(address.getId(), address.getLabel(), address.getRecipientName(),
                address.getPhoneNumber(), address.getAddressLine1(), address.getAddressLine2(),
                address.getLandmark(), address.getCity(), address.getDistrict(), address.getStateCode(),
                address.getPostalCode(), address.getCountryCode(), address.isDefaultAddress());
    }
}
