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

/**
 * Defines EditableDomainObject, which wraps domain objects
 * such that user code may work with and mutate a copy of the
 * domain object model; these changes may then be propagated
 * up to the real domain object (or not) by way of invoking
 * save or cancel behaviors of the "editor.completion"
 * capability (a capability intended as internal to edit
 * mode; invoked by way of the Save and Cancel actions.)
 */
define(
    [
        '../capabilities/EditablePersistenceCapability',
        '../capabilities/EditableContextCapability',
        '../capabilities/EditableCompositionCapability',
        '../capabilities/EditableRelationshipCapability',
        '../capabilities/EditableInstantiationCapability',
        '../capabilities/EditorCapability',
        '../capabilities/EditableActionCapability',
        './EditableDomainObjectCache'
    ],
    function (
        EditablePersistenceCapability,
        EditableContextCapability,
        EditableCompositionCapability,
        EditableRelationshipCapability,
        EditableInstantiationCapability,
        EditorCapability,
        EditableActionCapability,
        EditableDomainObjectCache
    ) {
        "use strict";

        var capabilityFactories = {
            persistence: EditablePersistenceCapability,
            context: EditableContextCapability,
            composition: EditableCompositionCapability,
            relationship: EditableRelationshipCapability,
            instantiation: EditableInstantiationCapability,
            editor: EditorCapability
        };

        // Handle special case where "editor.completion" wraps persistence
        // (other capability overrides wrap capabilities of the same type.)
        function getDelegateArguments(name, args) {
            return name === "editor" ? ['persistence'] : args;
        }

        /**
         * An EditableDomainObject overrides capabilities
         * which need to behave differently in edit mode,
         * and provides a "working copy" of the object's
         * model to allow changes to be easily cancelled.
         * @constructor
         * @memberof platform/commonUI/edit
         * @implements {DomainObject}
         */
        function EditableDomainObject(domainObject, $q) {
            // The cache will hold all domain objects reached from
            // the initial EditableDomainObject; this ensures that
            // different versions of the same editable domain object
            // are not shown in different sections of the same Edit
            // UI, which might thereby fall out of sync.
            var cache,
                originalObject = domainObject,
                cachedObject;

            // Constructor for EditableDomainObject, which adheres
            // to the same shared cache.
            function EditableDomainObjectImpl(domainObject, model) {
                var editableObject = Object.create(domainObject);

                // Only provide the cloned model.
                editableObject.getModel = function () { return model; };

                // Override certain capabilities
                editableObject.getCapability = function (name) {
                    var delegateArguments = getDelegateArguments(name, arguments),
                        capability = domainObject.getCapability.apply(
                            this,
                            delegateArguments
                        ),
                        Factory = capabilityFactories[name];

                    return (Factory && capability) ?
                            new Factory(capability, editableObject, domainObject, cache) :
                            capability;
                };


                editableObject.setOriginalObject = function(object) {
                    originalObject = object;
                };

                editableObject.getOriginalObject = function() {
                    return originalObject;
                };

                return editableObject;
            }

            cache = new EditableDomainObjectCache(EditableDomainObjectImpl, $q);
            cachedObject = cache.getEditableObject(domainObject);

            return cachedObject;
        }

        return EditableDomainObject;
    }
);
