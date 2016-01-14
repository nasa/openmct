/*****************************************************************************
 * Open MCT Web, Copyright (c) 2014-2015, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT Web is licensed under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 *
 * Open MCT Web includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/
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
         * @memberof platform/commonUI/edit
         * @implements {Representer}
         * @constructor
         */
        function EditRepresenter($q, $log, scope) {
            var self = this;

            this.scope = scope;

            // Mutate and persist a new version of a domain object's model.
            function doPersist(model) {
                var domainObject = self.domainObject;

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
            function commit(message) {
                // Look up from scope; these will have been populated by
                // mct-representation.
                var model = scope.model,
                    configuration = scope.configuration,
                    domainObject = self.domainObject;

                // Log the commit message
                $log.debug([
                    "Committing ",
                    domainObject && domainObject.getModel().name,
                    "(" + (domainObject && domainObject.getId()) + "):",
                    message
                ].join(" "));

                // Update the configuration stored in the model, and persist.
                if (domainObject && domainObject.hasCapability("persistence")) {
                    // Configurations for specific views are stored by
                    // key in the "configuration" field of the model.
                    if (self.key && configuration) {
                        model.configuration = model.configuration || {};
                        model.configuration[self.key] = configuration;
                    }
                    doPersist(model);
                }
            }

            function setEditable(editableDomainObject) {
                self.domainObject = editableDomainObject;
                scope.model = editableDomainObject.getModel();
            }

            // Place the "commit" method in the scope
            scope.commit = commit;
            scope.setEditable = setEditable;
        }

        // Handle a specific representation of a specific domain object
        EditRepresenter.prototype.represent = function represent(representation, representedObject) {
            // Track the key, to know which view configuration to save to.
            this.key = (representation || {}).key;
            // Track the represented object
            this.domainObject = representedObject;

            // Ensure existing watches are released
            this.destroy();
        };

        // Respond to the destruction of the current representation.
        EditRepresenter.prototype.destroy = function destroy() {
            // Nothing to clean up
        };

        return EditRepresenter;
    }
);
