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
        'use strict';

        /**
         * Wrapper for both "context" and "composition" capabilities;
         * ensures that any domain objects reachable in Edit mode
         * are also wrapped as EditableDomainObjects.
         *
         * Meant specifically for use by EditableDomainObject and the
         * associated cache; the constructor signature is particular
         * to a pattern used there and may contain unused arguments.
         * @constructor
         * @memberof platform/commonUI/edit
         */
        return function EditableLookupCapability(
            contextCapability,
            editableObject,
            domainObject,
            cache,
            idempotent
        ) {
            var capability = Object.create(contextCapability),
                method;

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
                return (result && result.then) ? // promise-like
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
                if (typeof capability[fn] === 'function') {
                    capability[fn] =
                        (idempotent ? oneTimeFunction : wrapFunction)(fn);
                }
            }

            // Wrap all methods; return only editable domain objects.
            for (method in contextCapability) {
                wrapMethod(method);
            }

            return capability;
        };
    }
);
