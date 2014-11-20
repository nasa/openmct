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
                        copyValues(model, result);
                        model.modified = Date.now();
                    }

                    // Report the result of the mutation
                    return mutationResult !== false;
                }

                // Invoke the provided mutator, then make changes to
                // the underlying model (if applicable.)
                return $q.when(mutator(clone))
                        .then(handleMutation);
            }

            return {
                invoke: mutate
            };
        }

        return MutationCapability;
    }
);