package in.utsavcrackers.platform;

import static org.assertj.core.api.Assertions.assertThat;
import java.util.Map;
import org.junit.jupiter.api.Test;

class HealthControllerTest {
    private final HealthController controller = new HealthController();

    @Test
    void healthReturnsUpStatusAndServiceName() {
        Map<String, Object> response = controller.health();
        assertThat(response).containsEntry("status", "UP")
                .containsEntry("service", "utsav-crackers-api")
                .containsKey("timestamp");
    }
}
