define([
    'lodash',
    'EventEmitter',
    './object-utils'
], function (
    _,
    EventEmitter,
    utils
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
        eventEmitter = new EventEmitter();;

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

    function objectDiffCalculator() {
        //TODO: Calculate diffs
        return [];
    }

    function qualifiedEventName(domainObject, eventName) {
        return [domainObject.getId(), eventName].join(':');
    }

    Objects.observe = function (domainObject) {
        return {
            on: function(eventName, callback) {
                if (eventName === '*') {
                    //Transitional API, use existing capability
                    return domainObject.getCapability("mutation").listen(callback);
                }
                return eventEmitter.on(qualifiedEventName(domainObject, eventName), callback);
            }
        }
    };

    Objects.mutate = function (domainObject, mutateFn){
        var beforeModel = JSON.parse(JSON.stringify(domainObject.getModel()));
        //Capability based for now. Will modify with ability to calculate diffs
        domainObject.getCapability("mutation").mutate(mutateFn).then(function () {
            //TODO: Calculate diffs and trigger events based on diff paths
            var afterModel = domainObject.getModel();
            objectDiffCalculator(beforeModel, afterModel).forEach( function (diff) {
                eventEmitter.emit(qualifiedEventName(domainObject, diff.path), diff.afterValue, diff.beforeValue);
            });
        });
    };

    return Objects;
});
