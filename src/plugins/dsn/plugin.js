
'use strict';

define([

], function (

) {
    var dictionary,
        DSN_DICTIONARY_URI = 'src/plugins/dsn/res/dsn-dictionary.json',
        DSN_KEY = 'dsn',
        DSN_NAMESPACE = 'deep.space.network';

    function getDsnDictionary() {
        // TODO: Replace http with library from npm
        return http.get(DSN_DICTIONARY_URI)
            .then(function (result) {
                return result.data;
            });
    }

    var objectProvider = {
        get: function (identifier) {
            if (identifier.key === DSN_KEY) {
                return Promise.resolve({
                    identifier: dictionary.identifier,
                    name: dictionary.name,
                    type: dictionary.type,
                    location: dictionary.location
                });
            }
        }
    };

    function DsnPlugin() {
        return function install(openmct) {
            openmct.objects.addRoot({
                namespace: DSN_NAMESPACE,
                key: DSN_KEY
            });

            // Add providers after the dictionary has been fetched
            getDsnDictionary().then(function (dsnDictionary) {
                dictionary = dsnDictionary;
                openmct.objects.addProvider(DSN_NAMESPACE, objectProvider);
            });
        };
    }

    return DsnPlugin;
});
