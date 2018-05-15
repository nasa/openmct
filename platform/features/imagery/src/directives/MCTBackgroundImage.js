/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2018, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT is licensed under the Apache License, Version 2.0 (the
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
 * Open MCT includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/

define(
    function () {

        /**
         * Defines the `mct-background-image` directive.
         *
         * Used as an attribute, this will set the `background-image`
         * property to the URL given in its value, but only after that
         * image has loaded; this avoids "flashing" as images change.
         *
         * If the value of `mct-background-image`is falsy, no image
         * will be displayed (immediately.)
         *
         * Optionally, a `filters` attribute may be specified as an
         * object with `brightness` and/or `contrast` properties,
         * whose values are percentages. A value of 100 will make
         * no changes to the image's brightness or contrast.
         *
         * @constructor
         * @memberof platform/features/imagery
         */
        function MCTBackgroundImage($document) {
            function link(scope, element) {
                // General strategy here:
                // - Keep count of how many images have been requested; this
                //   counter will be used as an internal identifier or sorts
                //   for each image that loads.
                // - As the src attribute changes, begin loading those images.
                // - When images do load, update the background-image property
                //   of the element, but only if a more recently
                //   requested image has not already been loaded.
                // The order in which URLs are passed in and the order
                // in which images are actually loaded may be different, so
                // some strategy like this is necessary to ensure that images
                // do not display out-of-order.
                var requested = 0, loaded = 0;

                function updateFilters(filters) {
                    var styleValue = filters ?
                        Object.keys(filters).map(function (k) {
                            return k + "(" + filters[k] + "%)";
                        }).join(' ') :
                        "";
                    element.css('filter', styleValue);
                    element.css('webkitFilter', styleValue);
                }

                function nextImage(url) {
                    var myCounter = requested,
                        image;

                    function useImage() {
                        if (loaded <= myCounter) {
                            loaded = myCounter;
                            element.css('background-image', "url('" + url + "')");
                        }
                    }

                    if (!url) {
                        loaded = myCounter;
                        element.css('background-image', 'none');
                    } else {
                        image = $document[0].createElement('img');
                        image.src = url;
                        image.onload = useImage;
                    }

                    requested += 1;
                }

                scope.$watch('mctBackgroundImage', nextImage);
                scope.$watchCollection('filters', updateFilters);
            }

            return {
                restrict: "A",
                scope: {
                    mctBackgroundImage: "=",
                    filters: "="
                },
                link: link
            };
        }

        return MCTBackgroundImage;
    }
);

