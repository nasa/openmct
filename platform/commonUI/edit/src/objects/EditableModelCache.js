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
         * An editable model cache stores domain object models that have been
         * made editable, to support a group that can be saved all-at-once.
         * This is useful in Edit mode, which is launched for a specific
         * object but may contain changes across many objects.
         * @memberof platform/commonUI/edit
         * @constructor
         */
        function EditableModelCache() {
            this.cache = {};
        }

        // Deep-copy a model. Models are JSONifiable, so this can be
        // done by stringification then destringification
        function clone(model) {
            return JSON.parse(JSON.stringify(model));
        }

        /**
         * Get this domain object's model from the cache (or
         * place it in the cache if it isn't in the cache yet)
         * @returns a clone of the domain object's model
         */
        EditableModelCache.prototype.getCachedModel = function (domainObject) {
            var id = domainObject.getId(),
                cache = this.cache;

            return (cache[id] =
                cache[id] || clone(domainObject.getModel()));
        };

        return EditableModelCache;
    }
);
