define([
    'lodash',
    'EventEmitter',
    './object-utils',
    './MutableObject'
], function (
    _,
    EventEmitter,
    utils,
    MutableObject
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
        FALLBACK_PROVIDER,
        eventEmitter = new EventEmitter();

    Objects._supersecretSetFallbackProvider = function (p) {
        FALLBACK_PROVIDER = p;
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
    }

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

    Objects.getMutable = function (object) {
        return new MutableObject(eventEmitter, object);
    };

    return Objects;
});
