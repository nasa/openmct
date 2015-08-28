/*global define*/

define(
    function () {
        "use strict";

        /**
         * Provides information about the currently logged-in
         * user, if available.
         *
         * @interface IdentityService
         */

        /**
         * Get information about the current user. This returns a promise
         * which will resolve to metadata about the user, or undefined if
         * no information about the user is available.
         *
         * @method IdentityService#getUser
         * @returns {Promise.<UserMetadata>} metadata about the current user
         */

        /**
         * Metadata about a user.
         *
         * @typedef UserMetadata
         * @property {string} name the user's human-readable name
         * @property {string} key the user's machine-readable name
         */

        /**
         * Aggregator for multiple identity services. Exposes the first
         * defined identity provided by any provider, according to
         * priority order.
         *
         * @implements {IdentityService}
         * @memberof platform/identity
         */
        function IdentityAggregator($q, providers) {
            this.providers = providers;
            this.$q = $q;
        }

        function delegateGetUser(provider) {
            return provider.getUser();
        }

        function identity(value) {
            return value;
        }

        function giveFirst(results) {
            return results.filter(identity)[0];
        }

        IdentityAggregator.prototype.getUser = function () {
            var $q = this.$q,
                promises = this.providers.map(delegateGetUser);

            return $q.all(promises).then(giveFirst);
        };

        return IdentityAggregator;
    }
);
