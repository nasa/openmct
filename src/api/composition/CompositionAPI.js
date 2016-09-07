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
     * An interface for interacting with the composition of domain objects.
     * The composition of a domain object is the list of other domain objects
     * it "contains" (for instance, that should be displayed beneath it
     * in the tree.)
     *
     * @interface CompositionAPI
     * @returns {module:openmct.CompositionCollection}
     * @memberof module:openmct
     */
    function composition(object) {
        var provider = getProvider(object);

        if (!provider) {
            return;
        }

        return new CompositionCollection(object, provider);
    }

    /**
     * Retrieve the composition (if any) of this domain object.
     *
     * @method get
     * @returns {module:openmct.CompositionCollection}
     * @memberof module:openmct.CompositionAPI#
     */
    composition.get = composition;

    /**
     * Add a composition provider.
     *
     * Plugins can add new composition providers to change the loading
     * behavior for certain domain objects.
     *
     * @method addProvider
     * @param {module:openmct.CompositionProvider} provider the provider to add
     * @returns {module:openmct.CompositionCollection}
     * @memberof module:openmct.CompositionAPI#
     */
    composition.addProvider = function (provider) {
        PROVIDER_REGISTRY.unshift(provider);
    };

    composition.addProvider(new DefaultCompositionProvider());

    return composition;

});
