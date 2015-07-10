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
 * Module defining SearchController. Created by shale on 07/08/2015.
 */
define(function () {
    "use strict";
    
    function SearchController($scope, objectService) {
        
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
                console.log('children ', children);
                for (i = 0; i < children.length; i += 1) {
                    console.log('children[', i, ']', children[i]); 
                    subList.push(listHelper(children[i]));
                    console.log('subList', subList, 'index', i);
                }
                console.log('sublist ', subList);
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
                    console.log('final result ', c);
                    $scope.items = c; // Somewhat redundant
                    return c;
                });
            });
        }
        
        // Search through items for items which contain the search term 
        // in the title
        function search(term) {
            console.log('search called, with term ', term);
            var searchResults = [],
                itemsLength,
                itemName,
                i;
            // Make not case sensitive
            if (term) {
                term = term.toLocaleLowerCase();
            }
            
            // refresh items list
            return listify().then( function () {
                itemsLength = $scope.items.length; // Slight time optimization
                for (i = 0; i < itemsLength; i += 1) {
                    itemName = $scope.items[i].getModel().name;
                    console.log('items[', i, '] name', itemName);
                    if (itemName.toLocaleLowerCase().includes(term)) {
                        searchResults.push($scope.items[i]);
                    }
                }
                console.log('search results ', searchResults);
                $scope.results = searchResults; // Somewhat redundant
                return searchResults;
            });
        }
        
        // When the search view is opened, call listify()
        // When the search button is pressed, call search()
        
        $scope.items = listify();
        $scope.results = search();
        
        return {
            search: search
        };
    }
    return SearchController;
});


 ///// Old stuff to look at later 

        // Get the root object
        /*
        objectService.getObjects(['root']).then(function (objects) {
            console.log('rootObject 1', rootObject);
            rootObject = objects.root;
            console.log('rootObject 2', rootObject);
            
            
            
            console.log('hasCapability("editor") ', rootObject.hasCapability('editor'));
            console.log('getModel() ', rootObject.getModel());
            console.log('getId() ', rootObject.getId());
            
            // Get the children of the root object 
            console.log('hasCapability("composition") ', rootObject.hasCapability('composition'));
            if (rootObject.hasCapability('composition')) {
                rootComposition = rootObject.getCapability('composition').invoke();
                console.log('rootComposition ', rootComposition);
            }
        });
        console.log('rootObject 3', rootObject);
        */
        

                // Recursive search 
                /*
                var subList = [current],
                    i;
                console.log('children ', children);
                for (i = 0; i < children.length; i += 1) {
                    console.log('children[', i, ']', children[i]); 
                    subList.push(listHelper(children[i]));
                    console.log('subList', subList, 'index', i);
                }
                console.log('sublist ', subList);
                return subList;
                */
                /*
                var array = [current].concat(children.forEach(listHelper));
                console.log('array ', array);
                return array;
                */
                /*
                var subList = [];//= Promise.all([]);
                subList.push(current);
                for (var i = 0, len = children.length; i < len; i++) {
                    listHelper(children[i]).then(function (c) {
                        subList.concat(c);
                    });
                }
                return subList;//.then(function (c) {
                //    return c;
                //});
                */


            /*
            // For now, we want this view to only be in the My Items folder 
            if ($scope.domainObject.getId() === 'mine') {
                var list = listHelper($scope.domainObject);
                //debugger;
                console.log(' ');
                console.log('list ', list);
                return list.then(function (c) {
                    console.log('final result ', c);
                    return c;
                });
            }
            */
        