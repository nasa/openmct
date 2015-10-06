/*global define */

define(
    function () {
        "use strict";

        /**
         * The location capability allows a domain object to know its current
         * parent, and also know its original parent.  When a domain object's
         * current parent is its original parent, the object is considered an
         * original, otherwise it's a link.
         *
         * @constructor
         */
        function LocationCapability($q, $injector, domainObject) {
            this.domainObject = domainObject;
            this.$q = $q;
            this.$injector = $injector;
            return this;
        }

        /**
         * Get an instance of this domain object in its original location.
         *
         * @returns {Promise.<DomainObject>} a promise for the original
         *          instance of this domain object
         */
        LocationCapability.prototype.getOriginal = function () {
            var id;

            if (this.isOriginal()) {
                return this.$q.when(this.domainObject);
            }

            id = this.domainObject.getId();

            this.objectService =
                this.objectService || this.$injector.get("objectService");

            // Assume that an object will be correctly contextualized when
            // loaded directly from the object service; this is true
            // so long as LocatingObjectDecorator is present, and that
            // decorator is also contained in this bundle.
            return this.objectService.getObjects([id])
                .then(function (objects) {
                    return objects[id];
                });
        };

        /**
         * Set the primary location (the parent id) of the current domain
         * object.
         *
         * @param {String} location the primary location to persist.
         * @returns {Promise} a promise that is resolved when the operation
         * completes.
         */
        LocationCapability.prototype.setPrimaryLocation = function (location) {
            var capability = this;
            return this.domainObject.useCapability(
                'mutation',
                function (model) {
                    model.location = location;
                }
            ).then(function () {
                return capability.domainObject
                    .getCapability('persistence')
                    .persist();
            });
        };

        /**
         * Returns the contextual location of the current domain object.  Only
         * valid for domain objects that have a context capability.
         *
         * @returns {String} the contextual location of the object; the id of
         * its parent.
         */
        LocationCapability.prototype.getContextualLocation = function () {
            var context = this.domainObject.getCapability("context");

            if (!context) {
                return;
            }

            return context.getParent().getId();
        };

        /**
         * Returns true if the domainObject is a link, false if it's an
         * original.
         *
         * @returns {Boolean}
         */
        LocationCapability.prototype.isLink = function () {
            var model = this.domainObject.getModel();

            return model.location !== this.getContextualLocation();
        };

        /**
         * Returns true if the domainObject is an original, false if it's a
         * link.
         *
         * @returns {Boolean}
         */
        LocationCapability.prototype.isOriginal = function () {
            return !this.isLink();
        };

        return LocationCapability;
    }
);
