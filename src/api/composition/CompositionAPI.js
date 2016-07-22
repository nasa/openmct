define([
    'lodash',
    'EventEmitter',
    './DefaultCompositionProvider',
    './CompositionCollection'
], function (
    _,
    EventEmitter,
    DefaultCompositionProvider,
    CompositionCollection
) {

    var PROVIDER_REGISTRY = [];

    function getProvider (object) {
        return _.find(PROVIDER_REGISTRY, function (p) {
            return p.appliesTo(object);
        });
    };

    function composition(object) {
        var provider = getProvider(object);

        if (!provider) {
            return;
        }

        return new CompositionCollection(object, provider);
    };

    composition.addProvider = function (provider) {
        PROVIDER_REGISTRY.unshift(provider);
    };

    composition.addProvider(new DefaultCompositionProvider());

    return composition;

});
