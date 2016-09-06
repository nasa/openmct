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

    /**
     * Retrieve the composition (if any) of this domain object. The
     * composition of a domain object is the list of other domain objects
     * it "contains" (for instance, that should be displayed beneath it
     * in the tree.)
     * @method Composition
     * @returns {module:openmct.CompositionCollection}
     * @memberof module:openmct.MCT#
     */
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
