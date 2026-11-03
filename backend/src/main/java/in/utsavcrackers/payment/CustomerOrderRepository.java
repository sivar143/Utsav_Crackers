package in.utsavcrackers.payment;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CustomerOrderRepository extends JpaRepository<CustomerOrder, UUID> {
    Optional<CustomerOrder> findByRazorpayOrderIdAndCustomerSubject(String razorpayOrderId, String customerSubject);
    Optional<CustomerOrder> findByRazorpayOrderId(String razorpayOrderId);
    java.util.List<CustomerOrder> findAllByPaymentStatusOrderByCreatedAtDesc(String paymentStatus);
}
