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
define ([
    'legacyRegistry'
], function (legacyRegistry) {
    var PREFIX = "msl-images:",
        CAMERAS = {
            fhaz: "Front Hazard Avoidance Camera",
            rhaz: "Rear Hazard Avoidance Camera",
            mast: "Mast Camera",
            chemcam: "Chemistry and Camera Complex",
            mahli: "Mars Hand Lens Imager",
            mardi: "Mars Descent Imager",
            navcam: "Navigation Camera"
        };


    function MSLImageModelProvider($q) {
        this.$q = $q;
    }

    MSLImageModelProvider.prototype.getModels = function (ids) {
        function modelFor(cam) {
            return {
                type: "folder",
                name: CAMERAS[cam]
            };
        }

        ids = ids.filter(function (id) {
            return id.indexOf(PREFIX) === 0;
        });

        return this.$q.when(ids.reduce(function (result, id) {
            var cam = id.split(":")[1];
            result[id] = modelFor(cam);
            return result;
        }, {}));
    };


    legacyRegistry.register("example/products", {
        "extensions": {
            "roots": [
                {
                    "id": "msl:images",
                    "priority" : "preferred",
                    "model": {
                        "type": "folder",
                        "name": "Mars Science Laboratory Images",
                        "composition": Object.keys(CAMERAS).map(function (cam) {
                            return PREFIX + cam;
                        })
                    }
                }
            ],
            "components": [
                {
                    "type": "provider",
                    "provides": "modelService",
                    "implementation": MSLImageModelProvider,
                    "depends": ["$q"]
                }
            ]
        }
    });
});

