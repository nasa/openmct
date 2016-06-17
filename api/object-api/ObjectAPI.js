define([
    'lodash'
], function (
    _
) {

    /**
        Object API.  Intercepts the existing object API while also exposing
        A new Object API.

        MCT.objects.get('mine')
            .then(function (root) {
                console.log(root);
                MCT.objects.getComposition(root)
                    .then(function (composition) {
                        console.log(composition)
                    })
            });
    */

    var Objects = {},
        ROOT_REGISTRY = [],
        PROVIDER_REGISTRY = {},
        FALLBACK_PROVIDER;

    window.MCT = window.MCT || {};
    window.MCT.objects = Objects;

    // take a key string and turn it into a key object
    // 'scratch:root' ==> {namespace: 'scratch', identifier: 'root'}
    function parseKeyString(key) {
        if (typeof key === 'object') {
            return key;
        }
        var namespace = '',
            identifier = key;
        for (var i = 0, escaped = false, len=key.length; i < len; i++) {
            if (key[i] === ":" && !escaped) {
                namespace = key.slice(0, i);
                identifier = key.slice(i + 1);
                break;
            }
        }
        return {
            namespace: namespace,
            identifier: identifier
        };
    };

    // take a key and turn it into a key string
    // {namespace: 'scratch', identifier: 'root'} ==> 'scratch:root'
    function makeKeyString(key) {
        if (typeof key === 'string') {
            return key;
        }
        if (!key.namespace) {
            return key.identifier;
        }
        return [
            key.namespace.replace(':', '\\:'),
            key.identifier.replace(':', '\\:')
        ].join(':');
    };

    // Converts composition to use key strings instead of keys
    function toOldFormat(model) {
        delete model.key;
        if (model.composition) {
            model.composition = model.composition.map(makeKeyString);
        }
        return model;
    };

    // converts composition to use keys instead of key strings
    function toNewFormat(model, key) {
        model.key = key;
        if (model.composition) {
            model.composition = model.composition.map(parseKeyString);
        }
        return model;
    };

    // Root provider is hardcoded in; can't be skipped.
    var RootProvider = {
        'get': function () {
            return Promise.resolve({
                name: 'The root object',
                type: 'root',
                composition: ROOT_REGISTRY
            });
        }
    };

    // Retrieve the provider for a given key.
    function getProvider(key) {
        if (key.identifier === 'ROOT') {
            return RootProvider;
        }
        return PROVIDER_REGISTRY[key.namespace] || FALLBACK_PROVIDER;
    };

    Objects.addProvider = function (namespace, provider) {
        PROVIDER_REGISTRY[namespace] = provider;
    };

    [
        'save',
        'delete',
        'get'
    ].forEach(function (method) {
        Objects[method] = function () {
            var key = arguments[0],
                provider = getProvider(key);

            if (!provider) {
                throw new Error('No Provider Matched');
            }

            if (!provider[method]) {
                throw new Error('Provider does not support [' + method + '].');
            }

            return provider[method].apply(provider, arguments);
        };
    });

    Objects.addRoot = function (key) {
        ROOT_REGISTRY.unshift(key);
    };

    Objects.removeRoot = function (key) {
        ROOT_REGISTRY = ROOT_REGISTRY.filter(function (k) {
            return (
                k.identifier !== key.identifier ||
                k.namespace !== key.namespace
            );
        });
    };

    function ObjectServiceProvider(objectService, instantiate) {
        this.objectService = objectService;
        this.instantiate = instantiate;
    }

    ObjectServiceProvider.prototype.save = function (object) {
        var key = object.key,
            keyString = makeKeyString(key),
            newObject = this.instantiate(toOldFormat(object), keyString);

        return object.getCapability('persistence')
                .persist()
                .then(function () {
                    return toNewFormat(object, key);
                });
    };

    ObjectServiceProvider.prototype.delete = function (object) {
        // TODO!
    };

    ObjectServiceProvider.prototype.get = function (key) {
        var keyString = makeKeyString(key);
        return this.objectService.getObjects([keyString])
            .then(function (results) {
                var model = JSON.parse(JSON.stringify(results[keyString].getModel()));
                return toNewFormat(model, key);
            });
    };

    // Injects new object API as a decorator so that it hijacks all requests.
    // Object providers implemented on new API should just work, old API should just work, many things may break.
    function ObjectAPIInjector(ROOTS, instantiate, objectService) {
        this.getObjects = function (keys) {
            var results = {},
                promises = keys.map(function (keyString) {
                    var key = parseKeyString(keyString);
                    return Objects.get(key)
                        .then(function (object) {
                            object = toOldFormat(object)
                            results[keyString] = instantiate(object, keyString);
                        });
                });

            return Promise.all(promises)
                .then(function () {
                    return results;
                });
        };

        FALLBACK_PROVIDER = new ObjectServiceProvider(objectService, instantiate);

        ROOTS.forEach(function (r) {
            ROOT_REGISTRY.push(parseKeyString(r.id));
        });

        return this;
    }

    return ObjectAPIInjector;
});
