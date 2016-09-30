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
    function CompositionAPI() {
        this.registry = [];
        this.policies = [];
        this.addProvider(new DefaultCompositionProvider());
    }

    /**
     * Add a composition provider.
     *
     * Plugins can add new composition providers to change the loading
     * behavior for certain domain objects.
     *
     * @method addProvider
     * @param {module:openmct.CompositionProvider} provider the provider to add
     * @memberof module:openmct.CompositionAPI#
     */
    CompositionAPI.prototype.addProvider = function (provider) {
        this.registry.unshift(provider);
    };

    /**
     * Retrieve the composition (if any) of this domain object.
     *
     * @method get
     * @returns {module:openmct.CompositionCollection}
     * @memberof module:openmct.CompositionAPI#
     */
    CompositionAPI.prototype.get = function (domainObject) {
        var provider = _.find(this.registry, function (p) {
            return p.appliesTo(object);
        });

        if (!provider) {
            return;
        }

        return new CompositionCollection(domainObject, provider);
    };

    /**
     * A composition policy is a function which either allows or disallows
     * placing one object in another's composition.
     *
     * Open MCT's policy model requires consensus, so any one policy may
     * reject composition by returning false. As such, policies should
     * generally be written to return true in the default case.
     *
     * @callback CompositionPolicy
     * @memberof module:openmct.CompositionAPI~
     * @param {module:openmct.DomainObject} containingObject the object which
     *        would act as a container
     * @param {module:openmct.DomainObject} containedObject the object which
     *        would be contained
     * @returns {boolean} false if this composition should be disallowed
     */

    /**
     * Add a composition policy. Composition policies may disallow domain
     * objects from containing other domain objects.
     *
     * @method addPolicy
     * @param {module:openmct.CompositionAPI~CompositionPolicy} policy
     *        the policy to add
     * @memberof module:openmct.CompositionAPI#
     */
    CompositionAPI.prototype.addPolicy = function (policy) {
        this.policies.push(policy);
    };

    /**
     * Check whether or not a domain object is allowed to contain another
     * domain object.
     *
     * @private
     * @method checkPolicy
     * @param {module:openmct.DomainObject} containingObject the object which
     *        would act as a container
     * @param {module:openmct.DomainObject} containedObject the object which
     *        would be contained
     * @returns {boolean} false if this composition should be disallowed

     * @param {module:openmct.CompositionAPI~CompositionPolicy} policy
     *        the policy to add
     * @memberof module:openmct.CompositionAPI#
     */
    CompositionAPI.prototype.checkPolicy = function (container, containee) {
        return this.policies.every(function (policy) {
            return policy(container, containee);
        });
    };

});
