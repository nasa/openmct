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
    [
        "../../platform/features/conductor/src/ConductorRepresenter",
        "../lib/hopscotch/hopscotch.min",
        "zepto"
    ],
    function (ConductorRepresenter, hopscotch, $){
        "use strict";

        function DemoInitializer($timeout, representers, objectService, $location) {

            function indexOf(array, callback) {
                return array.reduce(function(previous, element, index) {
                   if (previous=== -1 && callback(element)) {
                       return index;
                   } else {
                       return previous;
                   }
                }, -1);
            }

            function removeRepresenter(type){
                var index = indexOf(representers, function(representer) {
                    return representer.implementation === type;
                });
                if (index !== -1) {
                    representers.splice(index, 1);
                }
            }

            removeRepresenter(ConductorRepresenter);

            objectService.getObjects([
                "mct:demo"
            ]).then(function (objects) {
                objects["mct:demo"].useCapability("mutation", function (model) {
                    model.composition = [
                        "88a26104-8bd5-445d-8b57-10b567d2823d",
                        "f3744144-8842-4b7a-bddc-4abbf21315d9",
                        "1731fc2d-ddce-4ace-ae3c-60b46c178beb",
                        "b171cc31-2cc5-4ae9-ba40-baf1163f22c4"
                    ];
                })
            }).then(function() {
                //For default route, redirect user to layout
                if ($location.path().length == 0 || $location.path() === "/") {
                    $location.url("/browse/mct:demo/88a26104-8bd5-445d-8b57-10b567d2823d");
                }
            });

            $timeout(function() {
                var tour = {
                    id: "hello-hopscotch",
                    steps: [
                        {
                            title: "The Object Tree",
                            content: "The object tree contains telemetry and" +
                            " view <strong>objects</strong>",
                            target: document.querySelector("mct-tree ul.tree"),
                            placement: "right"
                        },
                        {
                            title: "Viewing objects",
                            content: "Objects selected in the tree" +
                            " are shown in the <strong>view</strong>",
                            target: document.querySelector(".object-holder-main"),
                            placement: "left",
                            xOffset: "200px;"
                        },
                        {
                            title: "Creating objects",
                            content: "New objects can be created under" +
                            " the <strong>My Items</strong> folder using the " +
                            " <strong>Create</strong> button",
                            target: document.querySelector(".create-btn"),
                            placement: "bottom"
                        },
                        /*
                        {
                            title: "Composing objects",
                            content: "Objects can be composed by dragging" +
                            " them from the tree...",
                            target: document.querySelector("mct-tree" +
                                " ul.tree"),
                            placement: "right"
                        },
                        {
                            title: "Composing objects (cont.)",
                            content: "...into the current view",
                            target: document.querySelector(".object-holder-main"),
                            placement: "top",
                            yOffset: "100px;"
                        }*/
                    ]
                };
                hopscotch.endTour(true);
                // Start the tour!
                hopscotch.startTour(tour);

            }, 3000);
        }

        return DemoInitializer;
    }
);
