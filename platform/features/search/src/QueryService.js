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

/**
 * Module defining QueryService. Created by shale on 07/13/2015.
 */
define(
    [],
    function () {
        "use strict";
        /**
         * The query service is responsible for creating an index 
         * of objects in the filetree which is searchable. 
         * @constructor
         */
        function QueryService(objectService, ROOT) {
            // Recursive helper function to go through the tree
            function listHelper(current) {
                var composition;
                if (current.hasCapability('composition')) {
                    composition = current.getCapability('composition');
                } else {
                    // Base case.
                    return current;
                }
                
                // Recursive case. Is asynchronous.
                return composition.invoke().then(function (children) {
                    var subList = [current],
                        i;
                    for (i = 0; i < children.length; i++) {
                        subList.push(listHelper(children[i]));
                    }
                    return subList;
                });
            }
            
            // Converts the filetree into a list
            // Eventually, plan to call search service (but do here for now)
            function getItems() {
                console.log('in getItems()');
                debugger;
                /*
                var elasticsearch = require(['platform/persistence/elastic'], function (elasticsearch) {
                    debugger;
                    
                    console.log('elasticsearch (inside) ', elasticsearch);
                    
                    var client = new elasticsearch.Client({
                        host: ROOT
                    });
                    console.log('client', client);
                    
                    var testsearch = client.search({q: 'name=test123'});//[params, [callback]]);
                    console.log('search', testsearch);
                });
                */
                var elasticsearch = require('elasticsearch');
                
                debugger; 
                
                console.log('elasticsearch (outside) ', elasticsearch);
                    
                var client = new elasticsearch.Client({
                    host: ROOT
                });
                console.log('client', client);

                var testsearch = client.search({q: 'name=test123'});//[params, [callback]]);
                console.log('search', testsearch);
                
                
                /*
                console.log('elasticsearch', elasticsearch);
                var client = new elasticsearch.Client({
                    host: 'localhost:9200'
                });
                console.log('client', client);
                var test = client.search();//[params, [callback]]);
                console.log('search', test);
                */
                
                /*
                var elasticApp = angular.module('elasticApp', ['elasticsearch']);
                console.log('elasticApp', elasticApp);
                
                var client = elasticApp.service('client', function (esFactory) {
                    return esFactory({
                        host: 'localhost:8080'
                    });
                });
                console.log('client', client);
                */
                /*
                var controller = elasticApp.controller('ElasticController', function ($scope, client, esFactory) {
                    client.cluster.state({
                        metric: [
                            'cluster_name',
                            'nodes',
                            'master_node',
                            'version'
                        ]
                    }).then(function (resp) {
                        $scope.clusterState = resp;
                        $scope.error = null;
                    }).catch(function (err) {
                        $scope.clusterState = null;
                        $scope.error = err;
                        // if the err is a NoConnections error, then the client was not able to
                        // connect to elasticsearch. In that case, create a more detailed error
                        // message
                        if (err instanceof esFactory.errors.NoConnections) {
                            $scope.error = new Error('Unable to connect to elasticsearch. ' +
                                                     'Make sure that it is running and listening ' + 
                                                     'at http://localhost:9200');
                        }
                    });
                });
                console.log('controller', controller);
                */
                /*
                var testSearch = client.search();//[params, [callback]]);
                console.log('search', testSearch);
                */
                
                // Aquire My Items (root folder)
                return objectService.getObjects(['mine']).then(function (objects) {
                    return listHelper(objects.mine).then(function (c) {
                        return c;
                    });
                });
            }
            
            return {
                getItems: getItems
            };
        }

        return QueryService;
    }
);