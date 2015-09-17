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

/*global define */

define(
    function () {
        "use strict";

        /**
         * Ensures that domain objects are loaded with a context capability
         * that reflects their location.
         * @constructor
         * @implements {ObjectService}
         * @memberof platform/entanglement
         */
        function LocatingObjectDecorator(contextualize, $q, $log, objectService) {
            this.contextualize = contextualize;
            this.$log = $log;
            this.objectService = objectService;
            this.$q = $q;
        }

        LocatingObjectDecorator.prototype.getObjects = function (ids) {
            var $q = this.$q,
                $log = this.$log,
                contextualize = this.contextualize,
                objectService = this.objectService,
                result = {};

            function loadObjectInContext(id, exclude) {
                function attachContextById(domainObject, locationId) {
                    return loadObjectInContext(locationId, exclude)
                        .then(function (parent) {
                            return contextualize(domainObject, parent);
                        });
                }

                function attachContextForLocation(domainObject) {
                    var model = domainObject && domainObject.getModel(),
                        location = (model || {}).location;

                    // Don't pursue a context if we encounter this
                    // object again during this sequence of invocations.
                    exclude[id] = true;

                    return location ?
                            attachContextById(domainObject, location) :
                            domainObject;
                }

                return objectService.getObjects([id]).then(function (objects) {
                    if (exclude[id]) {
                        $log.warn([
                            "LocatingObjectDecorator detected a cycle",
                            "while attempted to define a context for",
                            id + ";",
                            "no context will be added and unexpected behavior",
                            "may follow."
                        ].join(" "));
                        return objects[id];
                    }

                    return attachContextForLocation(objects[id]);
                });
            }

            ids.forEach(function (id) {
                result[id] = loadObjectInContext(id, {});
            });

            return $q.all(result);
        };

        return LocatingObjectDecorator;
    }
);

