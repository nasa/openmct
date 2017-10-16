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

define(['Cesium'], function () {
    return function () {
        return function (openmct) {
            var viewer = new Cesium.Viewer('cesiumContainer');
            
            var wyoming = viewer.entities.add({
              name : 'Wyoming',
              polygon : {
                hierarchy : Cesium.Cartesian3.fromDegreesArray([
                                          -109.080842,45.002073,
                                          -105.91517,45.002073,
                                          -104.058488,44.996596,
                                          -104.053011,43.002989,
                                          -104.053011,41.003906,
                                          -105.728954,40.998429,
                                          -107.919731,41.003906,
                                          -109.04798,40.998429,
                                          -111.047063,40.998429,
                                          -111.047063,42.000709,
                                          -111.047063,44.476286,
                                          -111.05254,45.002073]),
                height : 0,
                material : Cesium.Color.RED.withAlpha(0.5),
                outline : true,
                outlineColor : Cesium.Color.BLACK
              }
            });
            
            viewer.zoomTo(wyoming);
        };
    };
});