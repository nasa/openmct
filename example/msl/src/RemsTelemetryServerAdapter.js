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
    ["./RemsDataDictionary"],
    function (RemsDataDictionary) {
        "use strict";
        
        var TERRESTRIAL_DATE = "terrestrial_date", 
            NO_DATA = "--";
        
        /**
         * For now just returns a hard-coded data dictionary, but in future
         * could be adapted to provide data from remote source.
         * @constructor
         */
        function RemsTelemetryServerAdapter($q, $http, REMS_WS_URL){
            var histories = {},
                deferreds = {};
            
            function statisticalRejection(values){
                //First, calculate mean
                var mean = values.reduce(function(accumulator, value){
                    return accumulator += parseInt(value.value);
                }, 0) / values.length;
                var variance = values.reduce(function(accumulator, value){
                    return accumulator+= Math.pow(parseInt(value.value) - mean, 2);
                }, 0) / values.length;
                var stddev = Math.sqrt(variance);
                return values.filter(function(value){
                    return mean - stddev  < parseInt(value.value) && parseInt(value.value) < mean + stddev;
                })
            }
            
            function requestHistory (id) {
                $http.get(REMS_WS_URL).then(
                    function(response){
                        histories = {};
                        /**
                         * All history is fetched in one go, cache it all to save round trips to the server on subsequent requests
                         */
                        response.data.soles.forEach(function(solData){
                           for (var prop in solData){
                               histories[prop] = histories[prop] || [];
                               if (!isNaN(solData[prop])) {
                                   //var value = isNaN(solData[prop]) ? lastGoodValue : (lastGoodValue = solData[prop]);
                                   histories[prop].unshift({
                                       date: Date.parse(solData[TERRESTRIAL_DATE]),
                                       value: solData[prop]
                                   });
                               }
                           } 
                        });
                        //deferreds[id].resolve({id: id, values: statisticalRejection(histories[id])});
                        deferreds[id].resolve({id: id, values: histories[id]});
                    }, function (error){
                        deferreds[id].reject(error);
                    });
            }
            return {
                dictionary: RemsDataDictionary,
                history: function(id) {
                    deferreds[id] = deferreds[id] || $q.defer();
                    if (histories[id]) {
                        deferreds[id].resolve({id: id, values: histories[id]});
                    } else {
                        histories = {};
                        requestHistory(id);
                    }
                    return deferreds[id].promise;
                }
            };
        }
        return RemsTelemetryServerAdapter;
    });