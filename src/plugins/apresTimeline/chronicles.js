let provider;
export default provider =   {
            supportsRequest: function (domainObject) {
                return domainObject.type === 'example.telemetry';
            },
            request: function (domainObject, options) {
                let url = '/history/' +
                    domainObject.identifier.key +
                    '?start=' + options.start +
                    '&end=' + options.end;

                return http.get(url)
                    .then(function (resp) {
                        return resp.data;
                    });
            }
        };
