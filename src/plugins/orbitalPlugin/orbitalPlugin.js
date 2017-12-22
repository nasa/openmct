/*****************************************************************************
 * Open MCT Web, Copyright (c) 2014-2017, United States Government
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

define(['Cesium'], function (Cesium) {
    return function () {
        return function (openmct) {

            openmct.objects.addRoot({
                namespace: 'trajectory.namespace',
                key: 'spacecraft'
            });

            openmct.types.addType('orbitalType', {
                name: "Orbital Map",
                description: "Map that keeps track of trajectory or moving objects",
                creatable: true,
                cssClass: 'icon-image'
            });
            var i = 0;
            openmct.objectViews.addProvider({
                key: 'spacecraft',
                name: 'My View',
                canView: function (domainObject) {
                    //Return true if the view supports this domain object, or domain object type, otherwise false.
                    return true;
                },
                priority: function (domainObject) {
                   //If multiple views support a given domain object, return the priority of this view.
                    return 1000;
                },
                view: function (domainObject) {
                    return {
                        show: function (container) {
                            
                            container.innerHTML = `<style>
                                
                            
                            canvas {
                            
                                height: 100vh;
                                width: 100%;
                                margin: 0;
                                overflow: hidden;
                                padding: 0;
                                font-family: sans-serif;
                            }
                        </style><div
                         id="cesiumContainer" class="fullSize"></div>`;
                      
                            var viewer = new Cesium.CesiumWidget('cesiumContainer');
    
                        },
                        destroy: function (container) {
                        }
                    }
                }
            });
            
      
        };
    };
});