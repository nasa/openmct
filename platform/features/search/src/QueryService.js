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
        function QueryService(objectService) {
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
                    //console.log('children ', children);
                    for (i = 0; i < children.length; i++) {
                        //console.log('children[', i, ']', children[i]); 
                        subList.push(listHelper(children[i]));
                        //console.log('subList', subList, 'index', i);
                    }
                    //console.log('sublist ', subList);
                    return subList;
                });
            }

            // Recursive helper function to go through the tree
            function listHelper2(current) {
                return current.getCapability('composition').invoke().then(function (children) {
                    return [current].concat(children.forEach(function (child) {
                        if (child.hasCapability('composition')) {
                            return listHelper2(child);//.then(function (c) {
                            //    return c;
                            //});
                        } else {
                            return child;
                        }
                    }));
                });
            }

            // Converts the filetree into a list
            // Eventually, plan to call search service (but do here for now)
            function listify() {
                // Aquire My Items (root folder)
                return objectService.getObjects(['mine']).then(function (objects) {
                    return listHelper(objects.mine).then(function (c) {
                        //console.log('final result ', c);
                        return c;
                    });
                });
            }
            
            return {
                listify: listify
            };
        }

        return QueryService;
    }
);