package in.utsavcrackers.payment;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CustomerOrderRepository extends JpaRepository<CustomerOrder, UUID> {
    @Query("""
            select customerOrder from CustomerOrder customerOrder
            where customerOrder.deliveryStatus <> :excludedDeliveryStatus
              and (customerOrder.paymentStatus = 'PAID' or customerOrder.paymentMethod = 'COD')
            order by customerOrder.createdAt desc
            """)
    List<CustomerOrder> findActiveDeliveryOrders(@Param("excludedDeliveryStatus") String excludedDeliveryStatus);
}
