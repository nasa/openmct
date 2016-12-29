/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2016, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT is licensed under the Apache License, Version 2.0 (the
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
 * Open MCT includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/


define( () => {

        /**
         * Ensures that domain objects are loaded with a context capability
         * that reflects their location.
         * @constructor
         * @implements {ObjectService}
         * @memberof platform/entanglement
         */
        class LocatingObjectDecorator {
          constructor(contextualize, $q, $log, objectService) {
            this.contextualize = contextualize;
            this.$log = $log;
            this.objectService = objectService;
            this.$q = $q;
        }

        getObjects(ids) {
            let $q = this.$q,
                $log = this.$log,
                contextualize = this.contextualize,
                objectService = this.objectService,
                result = {};

            // Load a single object using location to establish a context
            const loadObjectInContext = (id, exclude) => {
                const attachContext = (objects) => {
                    let domainObject = (objects || {})[id],
                        model = domainObject && domainObject.getModel(),
                        location = (model || {}).location;

                    // If no location is defined, we can't look up a context.
                    if (!location) {
                        return domainObject;
                    }

                    // Avoid looping indefinitely on cyclical locations
                    if (exclude[id]) {
                        $log.warn([
                            "LocatingObjectDecorator detected a cycle",
                            "while attempted to define a context for",
                            id + ";",
                            "no context will be added and unexpected behavior",
                            "may follow."
                        ].join(" "));
                        return domainObject;
                    }

                    // Record that we've visited this ID to detect cycles.
                    exclude[id] = true;

                    // Do the recursive step to get the parent...
                    return loadObjectInContext(location, exclude)
                        .then( (parent) => {
                            // ...and then contextualize with it!
                            return contextualize(domainObject, parent);
                        });
                }
                return objectService.getObjects([id]).then(attachContext);
            }

            ids.forEach( (id) => {
                result[id] = loadObjectInContext(id, {});
            });

            return $q.all(result);
        };
      }
        return LocatingObjectDecorator;
    }
);

