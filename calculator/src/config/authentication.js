export default {
    oauth2_client_id: 'yanux-calculator',
    oauth2_authentication_server: `http://${window.location.hostname}:3001`,
    oauth2_authentication_server_token_endpoint: '/oauth2/token',
    oauth2_authentication_server_authorization_endpoint: '/oauth2/authorize',
    oauth2_authentication_server_verify_token_endpoint: '/api/verify_oauth2',
    oauth2_authentication_server_token_introspection_endpoint: '/api/token_info',
    oauth2_authentication_server_public_key_endpoint: '/api/public_key',
    oauth2_redirect_uri: `http://${window.location.hostname}:3006/`
}