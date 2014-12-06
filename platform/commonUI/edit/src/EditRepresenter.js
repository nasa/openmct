/*global define*/

define(
    [],
    function () {
        "use strict";

        /**
         * The EditRepresenter is responsible for implementing
         * representation-level behavior relevant to Edit mode.
         * Specifically, this listens for changes to view configuration
         * or to domain object models, and triggers persistence when
         * these are detected.
         *
         * This is exposed as an extension of category `representers`,
         * which mct-representation will utilize to add additional
         * behavior to each representation.
         *
         * This will be called once per mct-representation directive,
         * and may be reused for different domain objects and/or
         * representations resulting from changes there.
         *
         * @constructor
         */
        function EditRepresenter($q, scope) {
            var watches = [],
                domainObject,
                key;

            // Mutate and persist a new version of a domain object's model.
            function doPersist(model) {
                // First, mutate; then, persist.
                return $q.when(domainObject.useCapability("mutation", function () {
                    return model;
                })).then(function (result) {
                    // Only persist when mutation was successful
                    return result &&
                        domainObject.getCapability("persistence").persist();
                });
            }

            // Handle changes to model and/or view configuration
            function update() {
                // Look up from scope; these will have been populated by
                // mct-representation.
                var model = scope.model,
                    configuration = scope.configuration;

                // Update the configuration stored in the model, and persist.
                if (domainObject && domainObject.hasCapability("persistence")) {
                    // Configurations for specific views are stored by
                    // key in the "configuration" field of the model.
                    if (key && configuration) {
                        model.configuration = model.configuration || {};
                        model.configuration[key] = configuration;
                    }
                    doPersist(model);
                }
            }

            // Respond to the destruction of the current representation.
            function destroy() {
                // Stop watching for changes
                watches.forEach(function (deregister) { deregister(); });
                watches = [];
            }

            // Handle a specific representation of a specific domain object
            function represent(representation, representedObject) {
                // Track the key, to know which view configuration to save to.
                key = representation.key;
                // Track the represented object
                domainObject = representedObject;

                // Ensure existing watches are released
                destroy();

                // Watch for changes to model or configuration; keep the
                // results, as $watch returns an de-registration function.
                // Use the "editor" capability to check if we are in Edit mode.
                watches = representedObject.hasCapability("editor") ? [
                    scope.$watch("model", update, true),
                    scope.$watch("configuration", update, true)
                ] : [];
            }

            return {
                /**
                 * Set the current representation in use, and the domain
                 * object being represented.
                 *
                 * @param {RepresentationDefinition} representation the
                 *        definition of the representation in use
                 * @param {DomainObject} domainObject the domain object
                 *        being represented
                 */
                represent: represent,
                /**
                 * Release any resources associated with this representer.
                 */
                destroy: destroy
            };
        }

        return EditRepresenter;
    }
);