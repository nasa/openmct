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
    'text!./table-configuration.html'
],function (
    _,
    Vue, 
    TableConfigurationTemplate
) {
    return function TableConfigurationComponent(domainObject, openmct) {
        return new Vue({
            template: TableConfigurationTemplate,
            data: function () {
                return {
                     headers: {}
                };
            },
            methods: {
                updateHeaders: function (headers) {
                    this.headers = headers;
                }
            },
            mounted: function () {
                let tableConfiguration = new TableConfiguration(domainObject);
                let compositionCollection = openmct.composition.get(domainObject);

                tableConfiguration.on('headers-changed', this.updateHeaders);

                compositionCollection.load()
                    .then((composition) => {
                        tableConfiguration.loadConfiguration(domainObject, composition);
                        compositionCollection.on('added', tableConfiguration.addObject);
                        compositionCollection.on('removed', tableConfiguration.removeObject);
                    });
            },
            destroyed: function () {
                tableConfiguration.destroy();
            }
        });
    }
 });