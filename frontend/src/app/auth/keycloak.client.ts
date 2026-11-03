import Keycloak from 'keycloak-js';

// Local development identity provider. Production values must come from deployment runtime configuration.
export const keycloak = new Keycloak({
  url: window.location.hostname === 'localhost' ? 'http://localhost:8081' : window.location.origin + '/auth',
  realm: 'utsav-crackers',
  clientId: 'utsav-web'
});
