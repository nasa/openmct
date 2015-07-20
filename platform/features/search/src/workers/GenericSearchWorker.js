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
/*global self*/

(function () {
    "use strict";

    // Recursive helper function for getItems()
    function itemsHelper(children, i) {
        if (i >= children.length) {
            // Done!
            return children;
        } else if (children[i].hasCapability('composition')) {
            // This child has children
            return children[i].getCapability('composition').invoke().then(function (grandchildren) {
                // Add grandchildren to the end of the list
                // They will also be checked for composition
                return itemsHelper(children.concat(grandchildren), i + 1);
            });
        } else {
            // This child is a leaf
            return itemsHelper(children, i + 1);
        }
    }

    // Converts the filetree into a list
    function getItems(objectService) {
        // Aquire My Items (root folder)
        return objectService.getObjects(['mine']).then(function (objects) {
            // Get all of its descendents
            return itemsHelper([objects.mine], 0).then(function (items) {
                // Turn them into searchResult objects (object, id, and score)
                var searchResultItems = [];

                for (var i = 0; i < items.length; i += 1) {
                    searchResultItems.push({
                        id: items[i].getId(),
                        object: items[i],
                        score: 0 // Assign actual score when filtering for term
                    });
                }

                //console.log('searchResultItems (in Everything)', searchResultItems);
                return searchResultItems;
            });
        });
    }

    self.onmessage = function (event) {
        //console.log('in worker .. 1');
        //console.log('event.data', event.data);
        //console.log('objects 0', objects[0]);
        self.postMessage(itemsHelper(event.data, 0));
    };
}());
