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
    ['./EditableLookupCapability'],
    function (EditableLookupCapability) {
        'use strict';

        /**
         * Wrapper for the "context" capability;
         * ensures that any domain objects reachable in Edit mode
         * are also wrapped as EditableDomainObjects.
         *
         * Meant specifically for use by EditableDomainObject and the
         * associated cache; the constructor signature is particular
         * to a pattern used there and may contain unused arguments.
         * @constructor
         * @memberof platform/commonUI/edit
         * @implements {ContextCapability}
         */
        return function EditableContextCapability(
            contextCapability,
            editableObject,
            domainObject,
            cache
        ) {
            // This is a "lookup" style capability (it looks up other
            // domain objects), and it should be idempotent
            var capability = new EditableLookupCapability(
                    contextCapability,
                    editableObject,
                    domainObject,
                    cache,
                    true // Idempotent
                ),
                // Track the real root object for the Elements pane
                trueRoot = capability.getRoot();

            // Provide access to the real root, for the Elements pane.
            capability.getTrueRoot = function () {
                return trueRoot;
            };

            // Hide ancestry after the root of this subgraph
            if (cache.isRoot(domainObject)) {
                capability.getRoot = function () {
                    return editableObject;
                };
                capability.getPath = function () {
                    return [editableObject];
                };
            }

            return capability;
        };
    }
);
