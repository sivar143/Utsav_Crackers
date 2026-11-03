package in.utsavcrackers.customer;

import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional(readOnly = true)
public class CustomerAddressService {

    private final CustomerAddressRepository addresses;

    public CustomerAddressService(CustomerAddressRepository addresses) {
        this.addresses = addresses;
    }

    public List<CustomerAddressResponse> list(String customerSubject) {
        requireSubject(customerSubject);
        return addresses.findAllByCustomerSubjectOrderByCreatedAtAsc(customerSubject).stream()
                .map(CustomerAddressResponse::from)
                .toList();
    }

    @Transactional
    public CustomerAddressResponse create(String customerSubject, CustomerAddressRequest request) {
        requireSubject(customerSubject);
        List<CustomerAddress> existing = addresses.findAllByCustomerSubjectOrderByCreatedAtAsc(customerSubject);
        CustomerAddress address = new CustomerAddress(customerSubject, request, existing.isEmpty());
        return CustomerAddressResponse.from(addresses.save(address));
    }

    @Transactional
    public CustomerAddressResponse update(String customerSubject, UUID id, CustomerAddressRequest request) {
        CustomerAddress address = findOwned(customerSubject, id);
        address.updateDetails(request);
        return CustomerAddressResponse.from(address);
    }

    @Transactional
    public CustomerAddressResponse makeDefault(String customerSubject, UUID id) {
        CustomerAddress selected = findOwned(customerSubject, id);
        addresses.findAllByCustomerSubjectOrderByCreatedAtAsc(customerSubject).forEach(address -> {
            if (address.isDefaultAddress()) {
                address.clearDefault();
            }
        });
        selected.markDefault();
        return CustomerAddressResponse.from(selected);
    }

    @Transactional
    public void delete(String customerSubject, UUID id) {
        CustomerAddress selected = findOwned(customerSubject, id);
        boolean wasDefault = selected.isDefaultAddress();
        addresses.delete(selected);

        if (wasDefault) {
            addresses.findAllByCustomerSubjectOrderByCreatedAtAsc(customerSubject).stream()
                    .findFirst()
                    .ifPresent(CustomerAddress::markDefault);
        }
    }

    private CustomerAddress findOwned(String customerSubject, UUID id) {
        requireSubject(customerSubject);
        return addresses.findByIdAndCustomerSubject(id, customerSubject)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Address not found for the signed-in customer"));
    }

    private void requireSubject(String subject) {
        if (subject == null || subject.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "A signed-in customer is required");
        }
    }
}
