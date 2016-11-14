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
        "./Tour.js",
        "zepto"
    ],
    function (ConductorRepresenter, hopscotch, tour, $) {
        "use strict";

        function DemoInitializer($timeout, representers, objectService, $location, agentService) {

            function indexOf(array, callback) {
                return array.reduce(function (previous, element, index) {
                    if (previous === -1 && callback(element)) {
                        return index;
                    } else {
                        return previous;
                    }
                }, -1);
            }

            function removeRepresenter(type) {
                var index = indexOf(representers, function (representer) {
                    return representer.implementation === type;
                });
                if (index !== -1) {
                    representers.splice(index, 1);
                }
            }

            removeRepresenter(ConductorRepresenter);

            objectService.getObjects([
                "mine"
            ]).then(function (objects) {
                [
                    "88a26104-8bd5-445d-8b57-10b567d2823d",
                    "f3744144-8842-4b7a-bddc-4abbf21315d9",
                    "a32079d0-676b-4e9f-ade7-86d5d2f152fc",
                    "a330490d-59ba-4c0c-b046-e5450f29f39b",
                    "934b199f-917e-46a2-9935-3117a9e29218",
                    "b171cc31-2cc5-4ae9-ba40-baf1163f22c4"
                ].forEach(function (id, index) {
                    objects['mine'].getCapability('composition').add(id, index);
                });
                //For default route, redirect user to layout
                if ($location.path().length == 0 || $location.path() === "/") {
                    $location.url("browse/mine/88a26104-8bd5-445d-8b57-10b567d2823d?view=layout");
                }
            });

            if (!agentService.isMobile() &&
                !window.opener) {
                $timeout(function () {
                    hopscotch.endTour(true);
                    hopscotch.startTour(tour);

                }, 3000);
            }
        }

        return DemoInitializer;
    }
);
