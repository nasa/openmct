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
        function LocationCapability(domainObject) {
            this.domainObject = domainObject;
            return this;
        }

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
         */
        LocationCapability.prototype.isLink = function () {
            if (this.domainObject.getId() === "mine") {
                return false;
            }
            var model = this.domainObject.getModel();

            return model.location !== this.getContextualLocation();
        };

        /**
         * Returns true if the domainObject is an original, false if it's a
         * link.
         */
        LocationCapability.prototype.isOriginal = function () {
            if (this.domainObject.getId() === "mine") {
                return true;
            }
            var model = this.domainObject.getModel();

            return model.location === this.getContextualLocation();
        };

        function createLocationCapability(domainObject) {
            return new LocationCapability(domainObject);
        }

        return createLocationCapability;
    }
);
