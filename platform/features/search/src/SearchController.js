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
        var items = [],
            searchResults = [];
        
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
        

        
        // Converts the filetree into a list
        // Eventually, plan to call search service
        // (but do here for now)
        function listify() {
            // For now, we want this view to only be in the My Items folder 
            if ($scope.domainObject.getId() === 'mine') {
                var out = listHelper($scope.domainObject);
                //console.log('out', out);
                return out;
            }
            // Fallback if we aren't in My Items
            return items;
        }
        // Recursive helper function to go through the tree
        function listHelper(current) {
            //console.log('current', current);
            //console.log('current.getID', current.getId());
            var composition;
            if (current.hasCapability('composition')) {
                composition = current.getCapability('composition');
            } else {
                //console.log('does not have capability');
                return current;
            }
            composition.invoke().then(function (children) {
                if (children === []) {
                    return current;
                } else {
                    var subList = [current],
                        i;
                    for (i = 0; i < children.length; i += 1) {
                        subList.concat(listHelper(children[i]));
                    }
                    //console.log('subList ', subList); ////////////
                    return subList;
                }
            });
        }
        
        // Search through items for items which have the search term 
        // in the title
        function search(term) {
            // modify searchResults
            
            return searchResults;
        }
        
        // When the search view is opened, call listify()
        // When the search button is pressed, call search()
        
        $scope.items = listify();
        $scope.results = search();
    }
    return SearchController;
});