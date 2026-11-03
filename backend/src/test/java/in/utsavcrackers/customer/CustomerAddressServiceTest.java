package in.utsavcrackers.customer;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class CustomerAddressServiceTest {

    @Mock
    private CustomerAddressRepository addresses;

    private CustomerAddressService service;

    @BeforeEach
    void setUp() {
        service = new CustomerAddressService(addresses);
    }

    @Test
    void firstAddressBecomesDefaultAndIsOwnedByTheTokenSubject() {
        CustomerAddressRequest request = request("Home", "533001");
        when(addresses.findAllByCustomerSubjectOrderByCreatedAtAsc("subject-1")).thenReturn(List.of());
        when(addresses.save(org.mockito.ArgumentMatchers.any(CustomerAddress.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        CustomerAddressResponse response = service.create("subject-1", request);

        assertThat(response.defaultAddress()).isTrue();
        assertThat(response.countryCode()).isEqualTo("IN");
        assertThat(response.postalCode()).isEqualTo("533001");
    }

    @Test
    void refusesToUpdateAnAddressOwnedByAnotherCustomer() {
        UUID addressId = UUID.randomUUID();
        when(addresses.findByIdAndCustomerSubject(addressId, "subject-2")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.update("subject-2", addressId, request("Home", "533001")))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("404 NOT_FOUND");
    }

    @Test
    void markingAnAddressDefaultClearsThePreviousDefault() {
        UUID firstId = UUID.randomUUID();
        UUID secondId = UUID.randomUUID();
        CustomerAddress first = new CustomerAddress("subject-1", request("Home", "533001"), true);
        CustomerAddress second = new CustomerAddress("subject-1", request("Office", "533002"), false);
        when(addresses.findByIdAndCustomerSubject(secondId, "subject-1")).thenReturn(Optional.of(second));
        when(addresses.findAllByCustomerSubjectOrderByCreatedAtAsc("subject-1"))
                .thenReturn(List.of(first, second));

        CustomerAddressResponse response = service.makeDefault("subject-1", secondId);

        assertThat(response.defaultAddress()).isTrue();
        assertThat(first.isDefaultAddress()).isFalse();
        assertThat(second.isDefaultAddress()).isTrue();
    }

    @Test
    void deletingDefaultPromotesTheNextSavedAddress() {
        UUID addressId = UUID.randomUUID();
        CustomerAddress selected = new CustomerAddress("subject-1", request("Home", "533001"), true);
        CustomerAddress next = new CustomerAddress("subject-1", request("Office", "533002"), false);
        when(addresses.findByIdAndCustomerSubject(addressId, "subject-1")).thenReturn(Optional.of(selected));
        when(addresses.findAllByCustomerSubjectOrderByCreatedAtAsc("subject-1")).thenReturn(List.of(next));

        service.delete("subject-1", addressId);

        assertThat(next.isDefaultAddress()).isTrue();
        verify(addresses).delete(selected);
    }

    private CustomerAddressRequest request(String label, String postalCode) {
        return new CustomerAddressRequest(label, "Customer Name", "+919876543210",
                "12 Main Road", null, null, "Rajamahendravaram", "East Godavari",
                "IN-AP", postalCode, "IN");
    }
}
