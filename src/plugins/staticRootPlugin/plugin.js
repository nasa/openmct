define([
    './StaticModelProvider'
], function (
    StaticModelProvider
) {
    /**
     * Static Root Plugin: takes an export file and exposes it as a new root
     * object.
     */
    function StaticRootPlugin(namespace, exportUrl) {

        var rootIdentifier = {
            namespace: namespace,
            key: 'root'
        };

        var cachedProvider;

        var loadProvider = function () {
            return fetch(exportUrl)
                .then(function (response) {
                    return response.json();
                })
                .then(function (importData) {
                    cachedProvider = new StaticModelProvider(importData, rootIdentifier);
                    return cachedProvider;
                });

        };

        var getProvider = function () {
            if (!cachedProvider) {
                cachedProvider = loadProvider();
            }
            return Promise.resolve(cachedProvider);
        };

        return function install(openmct) {
            openmct.objects.addRoot(rootIdentifier);
            openmct.objects.addProvider(namespace, {
                get: function (identifier) {
                    return getProvider().then(function (provider) {
                        return provider.get(identifier);
                    });
                }
            });
        };
    }

    return StaticRootPlugin;
});
