/*global define,Promise*/

/**
 * Module defining MutationCapability. Created by vwoeltje on 11/12/14.
 */
define(
    [],
    function () {
        "use strict";

        // Utility function to overwrite a destination object
        // with the contents of a source object.
        function copyValues(destination, source) {
            // First, remove all previously-existing keys
            Object.keys(destination).forEach(function (k) {
                delete destination[k];
            });
            // Second, write all new keys
            Object.keys(source).forEach(function (k) {
                destination[k] = source[k];
            });
        }

        // Utility function to cast to a promise, without waiting
        // for nextTick if a value is non-promise-like.
        function fastPromise(value) {
            return (value || {}).then ? value : {
                then: function (callback) {
                    return fastPromise(callback(value));
                }
            };
        }

        /**
         * The `mutation` capability allows a domain object's model to be
         * modified. Wrapping such modifications in calls made through
         * this capability allows these changes to be tracked (e.g. to
         * ensure that a domain object's `modified` timestamp is kept
         * up-to-date.)
         *
         * Usage:
         *
         * ```
         * domainObject.useCapability("mutation", function (model) {
         *     // make changes to model here...
         * });
         * ```
         *
         * @param $q Angular's $q service, for promises
         * @param {DomainObject} domainObject the domain object
         *        which will expose this capability
         * @constructor
         */
        function MutationCapability($q, domainObject) {

            function mutate(mutator) {
                // Get the object's model and clone it, so the
                // mutator function has a temporary copy to work with.
                var model = domainObject.getModel(),
                    clone = JSON.parse(JSON.stringify(model));

                // Function to handle copying values to the actual
                function handleMutation(mutationResult) {
                    // If mutation result was undefined, just use
                    // the clone; this allows the mutator to omit return
                    // values and just change the model directly.
                    var result = mutationResult || clone;

                    // Allow mutators to change their mind by
                    // returning false.
                    if (mutationResult !== false) {
                        // Copy values if result was a different object
                        // (either our clone or some other new thing)
                        if (model !== result) {
                            copyValues(model, result);
                        }
                        model.modified = Date.now();
                    }

                    // Report the result of the mutation
                    return mutationResult !== false;
                }

                // Invoke the provided mutator, then make changes to
                // the underlying model (if applicable.)
                return fastPromise(mutator(clone)).then(handleMutation);
            }

            return {
                /**
                 * Alias of `mutate`, used to support useCapability.
                 */
                invoke: mutate,
                /**
                 * Modify the domain object's model, using a provided
                 * function. This function will receive a copy of the
                 * domain object's model as an argument; behavior
                 * varies depending on that function's return value:
                 *
                 * * If no value (or undefined) is returned by the mutator,
                 *   the state of the model object delivered as the mutator's
                 *   argument will become the domain object's new model.
                 *   This is useful for writing code that modifies the model
                 *   directly.
                 * * If a plain object is returned, that object will be used
                 *   as the domain object's new model.
                 * * If boolean `false` is returned, the mutation will be
                 *   cancelled.
                 * * If a promise is returned, its resolved value will be
                 *   handled as one of the above.
                 *
                 *
                 * @params {function} mutator the function which will make
                 *         changes to the domain object's model.
                 * @returns {Promise.<boolean>} a promise for the result
                 *         of the mutation; true if changes were made.
                 */
                mutate: mutate
            };
        }

        return MutationCapability;
    }
);