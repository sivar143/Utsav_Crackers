package in.utsavcrackers.customer;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CustomerAddressRepository extends JpaRepository<CustomerAddress, UUID> {
    List<CustomerAddress> findAllByCustomerSubjectOrderByCreatedAtAsc(String customerSubject);
    Optional<CustomerAddress> findByIdAndCustomerSubject(UUID id, String customerSubject);
}
