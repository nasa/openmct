/*global define*/

/**
 * Wrapper for both "context" and "composition" capabilities;
 * ensures that any domain objects reachable in Edit mode
 * are also wrapped as EditableDomainObjects
 */
define(
    [],
    function () {
        'use strict';

        return function EditableContextCapability(
            contextCapability,
            editableObject,
            domainObject,
            factory
        ) {
            var capability = Object.create(contextCapability);

            function isDomainObject(obj) {
                return typeof obj.getId === 'function' &&
                        typeof obj.getModel === 'function' &&
                        typeof obj.getCapability === 'function';
            }

            function makeEditableObject(obj) {
                return isDomainObject(obj) ?
                        factory.getEditableObject(obj) :
                        obj;
            }

            function makeEditable(obj) {
                return Array.isArray(obj) ?
                        obj.map(makeEditableObject) :
                        makeEditableObject(obj);
            }

            // Replace all methods; return only editable domain objects.
            Object.keys(contextCapability).forEach(function (k) {
                capability[k] = function () {
                    var result = contextCapability[k].apply(
                        capability,
                        arguments
                    );

                    return result.then ? // promise-like
                            result.then(makeEditable) :
                            makeEditable(result);
                };
            });

            return capability;
        };
    }
);