/*global define */

define(

    function () {

        function LocationCapability(domainObject) {
            this.domainObject = domainObject;
        }

        /**
         * Return the current location of the current domain object.  Only
         * valid for domain objects that have a context capability.
         */
        LocationCapability.prototype.getLocation = function () {
            var context = this.domainObject.getCapability("context"),
                pathObjects,
                pathIds;

            if (!context) {
                return this.domainObject.getId();
            }

            pathObjects = context.getPath();
            if (!pathObjects) {
                pathObjects = [];
            }

            pathIds = pathObjects.map(function (object) {
                return object.getId();
            });

            return pathIds.join('/');
        };

        /**
         * Returns true if the domainObject is a link, false if it's an
         * original.
         */
        LocationCapability.prototype.isLink = function () {
            var model = this.domainObject.getModel();

            return model.location !== this.getLocation();
        };

        /**
         * Returns true if the domainObject is an original, false if it's a
         * link.
         */
        LocationCapability.prototype.isOriginal = function () {
            var model = this.domainObject.getModel();

            return model.location === this.getLocation();
        };

        /**
         * Return true if the LocationCapability can apply to a given
         * domainObject, otherwise return false.
         */
        LocationCapability.appliesTo = function (domainObject) {
            return domainObject.hasCapability('context');
        };

        return LocationCapability;
    }
);
