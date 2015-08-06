/*global define */

define(
    function () {
        "use strict";

        function LocationCapability(domainObject) {
            this.domainObject = domainObject;
            return this;
        }

        /**
         * Persist the current location of the current domain object as it's
         * primary location.  Returns a promise.
         */
        LocationCapability.prototype.persistLocation = function () {
            return this.domainObject.useCapability(
                'mutation',
                function (model) {
                    model.location = this.getLocation();
                }.bind(this)
            ).then(function () {
                return this.domainObject
                    .getCapability('persistence')
                    .persist();
            }.bind(this));
        };

        /**
         * Return the current location of the current domain object.  Only
         * valid for domain objects that have a context capability.
         */
        LocationCapability.prototype.getLocation = function () {
            var context = this.domainObject.getCapability("context"),
                pathObjects,
                pathIds;

            if (!context) {
                return '';
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

            return model.location !== this.getLocation();
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

            return model.location === this.getLocation();
        };

        function createLocationCapability(domainObject) {
            return new LocationCapability(domainObject);
        }

        return createLocationCapability;
    }
);
