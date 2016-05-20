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
        SOURCE = "msl-images",
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
                type: "msl.image",
                name: CAMERAS[cam],
                telemetry: { key: cam }
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


    function MSLImageTelemetrySeries(photos) {
        this.photos = photos;
    }

    MSLImageTelemetrySeries.prototype.getPointCount = function () {
        return this.photos.length;
    };

    MSLImageTelemetrySeries.prototype.getDomainValue = function (i, key) {
        return new Date(this.photos[i][key || 'earth_date']).valueOf();
    };

    MSLImageTelemetrySeries.prototype.getRangeValue = function (i, key) {
        return this.photos[i][key || 'img_src'];
    };


    function MSLImageTelemetryProvider($q, $http) {
        this.$q = $q;
        this.$http = $http;
    }


    MSLImageTelemetryProvider.prototype.subscribe = function () {
        return function () {};
    };

    MSLImageTelemetryProvider.prototype.requestTelemetry = function (requests) {
        var $http = this.$http;

        function issueRequest(request) {
            var cam = request.key;
            var url =
                "https://api.nasa.gov/mars-photos/api/v1/rovers/curiosity/photos?sol=1000&camera=" +
                cam +
                "&api_key=DEMO_KEY";

            return $http.get(url).then(function (result) {
                return new MSLImageTelemetrySeries(result.data.photos);
            });
        }

        function packageResponse(seriesArray) {
            var result = {};
            result[SOURCE] =
                seriesArray.reduce(function (packaged, series, index) {
                    packaged[requests[index].key] = series;
                    return packaged;
                }, {});
            return result;
        }

        requests = requests.filter(function (request) {
            return request.source === SOURCE;
        });

        return this.$q.all(requests.map(issueRequest)).then(packageResponse);
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
                },
                {
                    "type": "provider",
                    "provides": "telemetryService",
                    "implementation": MSLImageTelemetryProvider,
                    "depends": ["$q", "$http"]
                }
            ],
            "types": [
                {
                    "key": "msl.image",
                    "name": "MSL Image",
                    "description": "Images from Curiosity",
                    "telemetry": {
                        "source": SOURCE,
                        "domains": [
                            {
                                "key": "earth_date",
                                "name": "Earth date",
                                "format": "utc"
                            }
                        ],
                        "ranges": [
                            {
                                "key": "id",
                                "name": "ID",
                                "format": "number"
                            },
                            {
                                "key": "img_src",
                                "name": "Image",
                                "format": "url"
                            }
                        ]
                    }
                }
            ]
        }
    });
});

