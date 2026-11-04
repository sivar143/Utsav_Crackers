package in.utsavcrackers.customer;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;

@Service
public class CustomerOtpService {
    private static final SecureRandom RANDOM = new SecureRandom();
    private final JdbcTemplate jdbc;
    private final ObjectProvider<JavaMailSender> mailSender;
    private final RestClient http = RestClient.create();
    private final String keycloakUrl;
    private final String realm;
    private final String adminUsername;
    private final String adminPassword;
    private final String smtpHost;
    private final String smtpFrom;

    public CustomerOtpService(
            JdbcTemplate jdbc,
            ObjectProvider<JavaMailSender> mailSender,
            @Value("${KEYCLOAK_INTERNAL_URL:http://localhost:8081}") String keycloakUrl,
            @Value("${KEYCLOAK_REALM:utsav-crackers}") String realm,
            @Value("${KEYCLOAK_ADMIN:admin}") String adminUsername,
            @Value("${KEYCLOAK_ADMIN_PASSWORD:}") String adminPassword,
            @Value("${SMTP_HOST:}") String smtpHost,
            @Value("${SMTP_FROM:}") String smtpFrom) {
        this.jdbc = jdbc;
        this.mailSender = mailSender;
        this.keycloakUrl = keycloakUrl.replaceAll("/+$", "");
        this.realm = realm;
        this.adminUsername = adminUsername;
        this.adminPassword = adminPassword;
        this.smtpHost = smtpHost;
        this.smtpFrom = smtpFrom;
    }

    public void start(OtpStartRequest request) {
        String contact = normalizeEmail(request.contact());
        Integer recent = jdbc.queryForObject(
                "SELECT COUNT(*) FROM customer_login_otps WHERE contact=? AND created_at > ?",
                Integer.class, contact, java.sql.Timestamp.from(Instant.now().minusSeconds(60)));
        if (recent != null && recent >= 3) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Please wait before requesting another code");
        }
        String code = "%06d".formatted(RANDOM.nextInt(1_000_000));
        String hash = hash(contact + ":" + code);
        jdbc.update("INSERT INTO customer_login_otps(contact,code_hash,expires_at) VALUES(?,?,?)",
                contact, hash, java.sql.Timestamp.from(Instant.now().plusSeconds(300)));
        try {
            JavaMailSender sender = mailSender.getIfAvailable();
            if (smtpHost.isBlank() || sender == null) {
                throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                        "Email OTP delivery is not configured. Set SMTP settings in .env.local.");
            }
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(contact);
            if (!smtpFrom.isBlank()) message.setFrom(smtpFrom);
            message.setSubject("Your Utsav Crackers verification code");
            message.setText("Your Utsav Crackers verification code is " + code
                    + ". It expires in 5 minutes. Do not share this code.");
            sender.send(message);
        } catch (ResponseStatusException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                    "The verification code could not be delivered. Check the configured email provider.");
        }
    }

    public Map<String, Object> verify(OtpVerifyRequest request) {
        String contact = normalizeEmail(request.contact());
        List<OtpRow> rows = jdbc.query("""
                SELECT id, code_hash, expires_at, attempts, consumed
                FROM customer_login_otps WHERE contact=?
                ORDER BY created_at DESC LIMIT 1
                """, (rs, row) -> new OtpRow(rs.getLong("id"), rs.getString("code_hash"),
                rs.getTimestamp("expires_at").toInstant(), rs.getInt("attempts"), rs.getBoolean("consumed")),
                contact);
        if (rows.isEmpty()) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "The code is invalid or expired");
        OtpRow otp = rows.get(0);
        if (otp.consumed || otp.expiresAt.isBefore(Instant.now()) || otp.attempts >= 5) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "The code is invalid or expired");
        }
        if (!MessageDigest.isEqual(otp.codeHash.getBytes(StandardCharsets.UTF_8),
                hash(contact + ":" + request.code()).getBytes(StandardCharsets.UTF_8))) {
            jdbc.update("UPDATE customer_login_otps SET attempts=attempts+1 WHERE id=?", otp.id);
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "The verification code is incorrect");
        }

        // Keep a valid email code retryable if Keycloak cannot issue the session.
        Map<String, Object> session = issueCustomerSession(contact);
        jdbc.update("UPDATE customer_login_otps SET consumed=TRUE WHERE id=?", otp.id);
        return session;
    }

    private Map<String, Object> issueCustomerSession(String email) {
        List<String> subjects = jdbc.query("SELECT keycloak_subject FROM customer_profiles WHERE email=?",
                (rs, row) -> rs.getString(1), email);
        String subject = subjects.isEmpty() ? createCustomer(email) : subjects.get(0);
        String temporaryPassword = UUID.randomUUID() + "A9!";
        String adminToken = adminToken();
        Map<?, ?> keycloakUser = http.get().uri(keycloakUrl + "/admin/realms/" + realm + "/users/" + subject)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken).retrieve().body(Map.class);
        String username = (String) keycloakUser.get("username");
        http.put().uri(keycloakUrl + "/admin/realms/" + realm + "/users/" + subject + "/reset-password")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .body(Map.of("type", "password", "value", temporaryPassword, "temporary", false))
                .retrieve().toBodilessEntity();

        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("grant_type", "password");
        form.add("client_id", "utsav-web");
        form.add("username", username);
        form.add("password", temporaryPassword);
        try {
            return http.post().uri(keycloakUrl + "/realms/" + realm + "/protocol/openid-connect/token")
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED).body(form).retrieve().body(Map.class);
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Identity-provider sign-in failed after verification");
        }
    }

    private String createCustomer(String email) {
        String adminToken = adminToken();
        Map<String, Object> user = Map.of(
                "username", email, "email", email, "emailVerified", true, "enabled", true,
                "firstName", "Customer",
                "credentials", List.of(Map.of("type", "password",
                        "value", UUID.randomUUID() + "A9!", "temporary", false)));
        org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
        headers.setBearerAuth(adminToken);
        headers.setContentType(MediaType.APPLICATION_JSON);
        org.springframework.http.ResponseEntity<Void> created = http.post()
                .uri(keycloakUrl + "/admin/realms/" + realm + "/users").headers(h -> h.addAll(headers))
                .body(user).retrieve().toBodilessEntity();
        java.net.URI location = created.getHeaders().getLocation();
        if (location == null) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Identity provider did not confirm customer creation");
        }
        String id = location.getPath().substring(location.getPath().lastIndexOf('/') + 1);
        Map<?, ?> role = http.get().uri(keycloakUrl + "/admin/realms/" + realm + "/roles/CUSTOMER")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken).retrieve().body(Map.class);
        http.post().uri(keycloakUrl + "/admin/realms/" + realm + "/users/" + id + "/role-mappings/realm")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken).contentType(MediaType.APPLICATION_JSON)
                .body(List.of(role)).retrieve().toBodilessEntity();
        jdbc.update("INSERT INTO customer_profiles(id,keycloak_subject,email,first_name,last_name,phone_number) VALUES(?,?,?,?,?,?)",
                UUID.randomUUID().toString(), id, email, "Customer", "", null);
        return id;
    }

    private String adminToken() {
        if (adminPassword.isBlank()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Customer identity provisioning is not configured");
        }
        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("grant_type", "password");
        form.add("client_id", "admin-cli");
        form.add("username", adminUsername);
        form.add("password", adminPassword);
        Map<?, ?> token = http.post().uri(keycloakUrl + "/realms/master/protocol/openid-connect/token")
                .contentType(MediaType.APPLICATION_FORM_URLENCODED).body(form).retrieve().body(Map.class);
        return (String) token.get("access_token");
    }

    private String normalizeEmail(String contact) {
        String value = contact.trim();
        if (!value.matches("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Enter a valid email address");
        }
        return value.toLowerCase();
    }

    private String hash(String value) {
        try {
            return java.util.HexFormat.of().formatHex(
                    MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception ex) {
            throw new IllegalStateException("Unable to hash verification code", ex);
        }
    }

    private record OtpRow(long id, String codeHash, Instant expiresAt, int attempts, boolean consumed) {}
}
