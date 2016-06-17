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
        PROVIDER_REGISTRY = [];

    window.MCT = window.MCT || {};
    window.MCT.objects = Objects;

    function parseKey(key) {
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

    function makeKey(namespace, identifier) {
        if (arguments.length === 1) {
            identifier = namespace.identifier;
            namespace = namespace.namespace;
        }
        if (!namespace) {
            return identifier
        }
        return [
            namespace.replace(':', '\\:'),
            identifier.replace(':', '\\:')
        ].join(':');
    };

    var RootProvider = {
        'get': function () {
            return Promise.resolve({
                name: 'The root object',
                type: 'root',
                composition: ROOT_REGISTRY
            });
        }
    };

    function getProvider(key) {
        if (key.identifier === 'ROOT') {
            return RootProvider;
        }
        return PROVIDER_REGISTRY.filter(function (p) {
            return p.appliesTo(key);
        })[0];
    };

    Objects.addProvider = function (provider) {
        PROVIDER_REGISTRY.push(provider);
    };

    [
        'create',
        'save',
        'delete',
        'get'
    ].forEach(function (method) {
        Objects[method] = function () {
            var key = arguments[0],
                keyParts = parseKey(key),
                provider = getProvider(keyParts),
                args = [keyParts].concat([].slice.call(arguments, 1));

            if (!provider) {
                throw new Error('No Provider Matched');
            }

            if (!provider[method]) {
                throw new Error('Provider does not support [' + method + '].');
            }

            return provider[method].apply(provider, args);
        };
    });

    Objects.getComposition = function (object) {
        if (!object.composition) {
            throw new Error('object has no composition!');
        }
        return Promise.all(object.composition.map(Objects.get, Objects));
    };

    Objects.addRoot = function (keyParts) {
        var key = makeKey(keyParts);
        ROOT_REGISTRY.push(key);
    };

    Objects.removeRoot = function (keyParts) {
        var key = makeKey(keyParts);
        ROOT_REGISTRY = ROOT_REGISTRY.filter(function (k) {
            return k !== key;
        });
    };

    function ObjectServiceProvider(objectService, instantiate) {
        this.objectService = objectService;
        this.instantiate = instantiate;
    }

    ObjectServiceProvider.prototype.appliesTo = function (keyParts) {
        return true;
    };

    ObjectServiceProvider.prototype.create = function (keyParts, object) {
        var key = makeKey(keyParts),
            object = this.instantiate(object, key);

        return object.getCapability('persistence')
                .persist()
                .then(function () {
                    return object;
                });
    };

    ObjectServiceProvider.prototype.save = function (keyParts, object) {
        var key = makeKey(keyParts);
        return this.objectService.getObjects([key])
            .then(function (results) {
                var obj = results[key];
                obj.getCapability('mutation').mutate(function (model) {
                    _.extend(model, object);
                });
                return obj.getCapability('persistence')
                    .persist()
                    .then(function () {
                        return object;
                    });
            });
    };

    ObjectServiceProvider.prototype.delete = function (keyParts, object) {
        // TODO!
    };

    ObjectServiceProvider.prototype.get = function (keyParts) {
        var key = makeKey(keyParts);
        return this.objectService.getObjects([key])
            .then(function (results) {
                var model = results[key].getModel();
                if (model.composition) {
                    model.composition = model.composition.map(parseKey);
                }
                return model;
            });
    };

    function ObjectAPI(ROOTS, instantiate, objectService) {
        this.getObjects = function (keys) {
            var results = {},
                promises = keys.map(function (key) {
                    return Objects.get(key)
                        .then(function (object) {
                            results[key] = instantiate(object, key);
                        });
                });

            return Promise.all(promises)
                .then(function () {
                    return results;
                });
        };

        PROVIDER_REGISTRY.push(new ObjectServiceProvider(objectService, instantiate));

        ROOTS.forEach(function (r) {
            ROOT_REGISTRY.push(r.id);
        });

        return this;
    }

    return ObjectAPI;
});
