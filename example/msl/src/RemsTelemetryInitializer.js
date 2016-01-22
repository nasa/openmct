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
    function (){
        "use strict";

        var TAXONOMY_ID = "msl:curiosity",
            PREFIX = "msl_tlm:";

        /**
         * Function that is executed on application startup and populates
         * the navigation tree with objects representing the MSL REMS
         * telemetry points. The tree is populated based on the data
         * dictionary on the provider.
         *
         * @param {RemsTelemetryServerAdapter} adapter The server adapter
         * (necessary in order to retrieve data dictionary)
         * @param objectService the ObjectService which allows for lookup of
         * objects by ID
         * @constructor
         */
        function RemsTelemetryInitializer(adapter, objectService) {
            function makeId(element) {
                return PREFIX + element.identifier;
            }

            function initializeTaxonomy(dictionary) {
                function getTaxonomyObject(domainObjects) {
                    return domainObjects[TAXONOMY_ID];
                }

                function populateModel (taxonomyObject) {
                    return taxonomyObject.useCapability(
                        "mutation",
                        function (model) {
                            model.name = dictionary.name;
                            model.composition = dictionary.instruments.map(makeId);
                        }
                    );
                }

                objectService.getObjects([TAXONOMY_ID])
                    .then(getTaxonomyObject)
                    .then(populateModel);
            }
            initializeTaxonomy(adapter.dictionary);
        }
        return RemsTelemetryInitializer;
    }
);
