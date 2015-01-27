/*global define*/


define(
    [],
    function () {
        'use strict';

        /**
         * Wrapper for both "context" and "composition" capabilities;
         * ensures that any domain objects reachable in Edit mode
         * are also wrapped as EditableDomainObjects.
         *
         * Meant specifically for use by EditableDomainObject and the
         * associated cache; the constructor signature is particular
         * to a pattern used there and may contain unused arguments.
         */
        return function EditableLookupCapability(
            contextCapability,
            editableObject,
            domainObject,
            cache,
            idempotent
        ) {
            var capability = Object.create(contextCapability);

            // Check for domain object interface. If something has these
            // three methods, we assume it's a domain object.
            function isDomainObject(obj) {
                return obj !== undefined &&
                        typeof obj.getId === 'function' &&
                        typeof obj.getModel === 'function' &&
                        typeof obj.getCapability === 'function';
            }

            // Check an object returned by the wrapped capability; if it
            // is a domain object, we want to make it editable and/or get
            // it from the cache of editable domain objects. This will
            // prevent changes made in edit mode from modifying the actual
            // underlying domain object.
            function makeEditableObject(obj) {
                return isDomainObject(obj) ?
                        cache.getEditableObject(obj) :
                        obj;
            }

            // Wrap a returned value (see above); if it's an array, wrap
            // all elements.
            function makeEditable(returnValue) {
                return Array.isArray(returnValue) ?
                        returnValue.map(makeEditableObject) :
                        makeEditableObject(returnValue);
            }

            // Wrap a returned value (see above); if it's a promise, wrap
            // the resolved value.
            function wrapResult(result) {
                return result.then ? // promise-like
                        result.then(makeEditable) :
                        makeEditable(result);
            }

            // Return a wrapped version of a function, which ensures
            // all results are editable domain objects.
            function wrapFunction(fn) {
                return function () {
                    return wrapResult(contextCapability[fn].apply(
                        capability,
                        arguments
                    ));
                };
            }

            // Wrap a method such that it only delegates once.
            function oneTimeFunction(fn) {
                return function () {
                    var result = wrapFunction(fn).apply(this, arguments);
                    capability[fn] = function () {
                        return result;
                    };
                    return result;
                };
            }

            // Wrap a method of this capability
            function wrapMethod(fn) {
                capability[fn] =
                    (idempotent ? oneTimeFunction : wrapFunction)(fn);
            }

            // Wrap all methods; return only editable domain objects.
            Object.keys(contextCapability).forEach(wrapFunction);

            return capability;
        };
    }
);