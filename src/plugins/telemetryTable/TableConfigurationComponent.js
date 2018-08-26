/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2018, United States Government
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
    'vue',
    'text!./table-configuration.html',
    './TelemetryTableConfiguration'
],function (
    _,
    Vue, 
    TableConfigurationTemplate,
    TelemetryTableConfiguration
) {
    return function TableConfigurationComponent(domainObject, openmct) {
        const tableConfiguration = new TelemetryTableConfiguration(domainObject, openmct);
        let unlisteners = [];
        unlisteners.push(openmct.objects.observe(domainObject, '*', (newDomainObject) => {
            domainObject = newDomainObject;
        }));

        function defaultConfiguration(domainObject) {
            let configuration = domainObject.configuration;
            configuration.table = configuration.table || {
                columns: {}
            };
            return configuration;
        }

        return new Vue({
            template: TableConfigurationTemplate,
            data: function () {
                return {
                    headers: {},
                    configuration: defaultConfiguration(domainObject)
                }
            },
            methods: {
                updateHeaders: function (headers) {
                    this.headers = headers;
                },
                toggleColumn: function (key) {
                    let isVisible = this.configuration.table.columns[key];
                    
                    if (isVisible === undefined) {
                        isVisible = true;
                    }

                    this.configuration.table.columns[key] = !isVisible;
                    openmct.objects.mutate(domainObject, "configuration", this.configuration);
                }
            },
            mounted: function () {
                let compositionCollection = openmct.composition.get(domainObject);

                tableConfiguration.on('headers-changed', this.updateHeaders);

                compositionCollection.load()
                    .then((composition) => {
                        tableConfiguration.addColumnsForAllObjects(composition);
                        compositionCollection.on('add', addObject);
                        unlisteners.push(compositionCollection.off.bind(compositionCollection, 'add', addObject));

                        compositionCollection.on('remove', removeObject);
                        unlisteners.push(compositionCollection.off.bind(compositionCollection, 'remove', removeObject));
                    });
                
                function addObject(domainObject) {
                    tableConfiguration.addColumnsForObject(domainObject, true);
                }

                function removeObject(domainObject) {
                    tableConfiguration.removeColumnsForObject(domainObject, true);
                }
            },
            destroyed: function () {
                tableConfiguration.destroy();
                unlisteners.forEach((unlisten) => unlisten());
            }
        });
    }
 });