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

define([
    'lodash'
], function (_) {
    var bundleMap = {
        couchDB: 'platform/persistence/couch',
        elasticsearch: 'platform/persistence/elastic',
        espresso: 'platform/commonUI/themes/espresso',
        localStorage: 'platform/persistence/local',
        myItems: 'platform/features/my-items',
        snow: 'platform/commonUI/themes/snow',
        utcTimeSystem: 'platform/features/conductor/utcTimeSystem'
    };

    var plugins = _(bundleMap).map(function (pluginName, bundleName) {
        return function (openmct) {
            openmct.legacyRegistry.enable(bundleName);
        };
    });

    plugins.CouchDB = function (url) {
        return function (openmct) {
            if (url) {
                var bundleName = "config/couch";
                openmct.legacyRegistry.register(bundleName, {
                    "extensions": {
                        "constants": [
                            {
                                "key": "COUCH_PATH",
                                "value": url,
                                "priority": "mandatory"
                            }
                        ]
                    }
                });
                openmct.legacyRegistry.enable(bundleName);
            }

            openmct.legacyRegistry.enable(bundleMap.couchDB);
        };
    };

    plugins.ElasticSearch = function (url) {
        return function (openmct) {
            if (url) {
                var bundleName = "config/elastic";
                openmct.legacyRegistry.register(bundleName, {
                    "extensions": {
                        "constants": [
                            {
                                "key": "ELASTIC_ROOT",
                                "value": url,
                                "priority": "mandatory"
                            }
                        ]
                    }
                });
                openmct.legacyRegistry.enable(bundleName);
            }

            openmct.legacyRegistry.enable(bundleMap.elasticsearch);
        };
    };

    return plugins;
});
