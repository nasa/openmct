define([
    './object-utils',
    './ObjectAPI'
], function (
    utils,
    ObjectAPI
) {
    function ObjectServiceProvider(objectService, instantiate) {
        this.objectService = objectService;
        this.instantiate = instantiate;
    }

    ObjectServiceProvider.prototype.save = function (object) {
        var key = object.key,
            keyString = utils.makeKeyString(key),
            newObject = this.instantiate(utils.toOldFormat(object), keyString);

        return object.getCapability('persistence')
                .persist()
                .then(function () {
                    return utils.toNewFormat(object, key);
                });
    };

    ObjectServiceProvider.prototype.delete = function (object) {
        // TODO!
    };

    ObjectServiceProvider.prototype.get = function (key) {
        var keyString = utils.makeKeyString(key);
        return this.objectService.getObjects([keyString])
            .then(function (results) {
                var model = JSON.parse(JSON.stringify(results[keyString].getModel()));
                return utils.toNewFormat(model, key);
            });
    };

    // Injects new object API as a decorator so that it hijacks all requests.
    // Object providers implemented on new API should just work, old API should just work, many things may break.
    function LegacyObjectAPIInterceptor(ROOTS, instantiate, objectService) {
        this.getObjects = function (keys) {
            var results = {},
                promises = keys.map(function (keyString) {
                    var key = utils.parseKeyString(keyString);
                    return ObjectAPI.get(key)
                        .then(function (object) {
                            object = utils.toOldFormat(object)
                            results[keyString] = instantiate(object, keyString);
                        });
                });

            return Promise.all(promises)
                .then(function () {
                    return results;
                });
        };

        ObjectAPI._supersecretSetFallbackProvider(
            new ObjectServiceProvider(objectService, instantiate)
        );

        ROOTS.forEach(function (r) {
            ObjectAPI.addRoot(utils.parseKeyString(r.id));
        });

        return this;
    }

    return LegacyObjectAPIInterceptor;
});
