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
        '../capabilities/EditorCapability',
        './EditableDomainObjectCache'
    ],
    function (
        EditablePersistenceCapability,
        EditableContextCapability,
        EditableCompositionCapability,
        EditableRelationshipCapability,
        EditorCapability,
        EditableDomainObjectCache
    ) {
        "use strict";

        var capabilityFactories = {
            persistence: EditablePersistenceCapability,
            context: EditableContextCapability,
            composition: EditableCompositionCapability,
            relationship: EditableRelationshipCapability,
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
         */
        function EditableDomainObject(domainObject) {
            // The cache will hold all domain objects reached from
            // the initial EditableDomainObject; this ensures that
            // different versions of the same editable domain object
            // are not shown in different sections of the same Edit
            // UI, which might thereby fall out of sync.
            var cache;

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
                        factory = capabilityFactories[name];

                    return (factory && capability) ?
                            factory(capability, editableObject, domainObject, cache) :
                            capability;
                };

                return editableObject;
            }

            cache = new EditableDomainObjectCache(EditableDomainObjectImpl);

            return cache.getEditableObject(domainObject);
        }

        return EditableDomainObject;
    }
);