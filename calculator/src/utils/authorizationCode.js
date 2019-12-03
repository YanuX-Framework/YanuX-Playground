import queryString from 'query-string'
export default (state) => {
    const parameters = queryString.parse(window.location.search);
    if (parameters.state && parameters.code && state === parameters.state) {
        return parameters.code
    }
}