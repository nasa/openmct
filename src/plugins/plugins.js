/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2017, United States Government
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
    'lodash',
    './utcTimeSystem/plugin',
    '../../example/generator/plugin',
    '../../platform/features/autoflow/plugin',
    './timeConductor/plugin',
    '../../example/imagery/plugin',
    '../../platform/import-export/bundle'
], function (
    _,
    UTCTimeSystem,
    GeneratorPlugin,
    AutoflowPlugin,
    TimeConductorPlugin,
    ExampleImagery,
    ImportExport
) {
    var bundleMap = {
        CouchDB: 'platform/persistence/couch',
        Elasticsearch: 'platform/persistence/elastic',
        Espresso: 'platform/commonUI/themes/espresso',
        LocalStorage: 'platform/persistence/local',
        MyItems: 'platform/features/my-items',
        Snow: 'platform/commonUI/themes/snow'
    };

    var plugins = _.mapValues(bundleMap, function (bundleName, pluginName) {
        return function pluginConstructor() {
            return function (openmct) {
                openmct.legacyRegistry.enable(bundleName);
            };
        };
    });

    plugins.UTCTimeSystem = UTCTimeSystem;

    plugins.ImportExport = ImportExport;

    /**
     * A tabular view showing the latest values of multiple telemetry points at
     * once. Formatted so that labels and values are aligned.
     *
     * @param {Object} [options] Optional settings to apply to the autoflow
     * tabular view. Currently supports one option, 'type'.
     * @param {string} [options.type] The key of an object type to apply this view
     * to exclusively.
     */
    plugins.AutoflowView = AutoflowPlugin;

    plugins.Conductor = TimeConductorPlugin;

    plugins.CouchDB = function (url) {
        return function (openmct) {
            if (url) {
                var bundleName = "config/couch";
                openmct.legacyRegistry.register(bundleName, {
                    "extensions": {
                        "constants": [
                            {
                                "key": "COUCHDB_PATH",
                                "value": url,
                                "priority": "mandatory"
                            }
                        ]
                    }
                });
                openmct.legacyRegistry.enable(bundleName);
            }

            openmct.legacyRegistry.enable(bundleMap.CouchDB);
        };
    };

    plugins.Elasticsearch = function (url) {
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

            openmct.legacyRegistry.enable(bundleMap.Elasticsearch);
        };
    };

    plugins.Generator = function () {
        return GeneratorPlugin;
    };

    plugins.ExampleImagery = ExampleImagery;

    return plugins;
});
