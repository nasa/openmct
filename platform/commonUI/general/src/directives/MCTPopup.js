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
    function () {
        'use strict';

        var TEMPLATE = "<div></div>";

        /**
         * The `mct-popup` directive may be used to display elements
         * which "pop up" over other parts of the page. Typically, this is
         * done in conjunction with an `ng-if` to control the visibility
         * of the popup.
         *
         * Example of usage:
         *
         *     <mct-popup ng-if="someExpr">
         *         <span>These are the contents of the popup!</span>
         *     </mct-popup>
         *
         * @constructor
         * @memberof platform/commonUI/general
         * @param $window the window object (as injected by Angular)
         * @param $document the jqLite-wrapped document
         * @param $compile Angular's $compile service
         */
        function MCTPopup($window, $document, $compile) {
            function link(scope, element, attrs, ctrl, transclude) {
                var body = $document.find('body'),
                    popup = $compile(TEMPLATE)(scope),
                    winDim = [$window.innerWidth, $window.innerHeight],
                    rect = element.parent()[0].getBoundingClientRect(),
                    position = [ rect.left, rect.top ],
                    isLeft = position[0] <= (winDim[0] / 2),
                    isTop = position[1] <= (winDim[1] / 2);

                popup.css('position', 'absolute');
                popup.css(
                    isLeft ? 'left' : 'right',
                    (isLeft ? position[0] : (winDim[0] - position[0])) + 'px'
                );
                popup.css(
                    isTop ? 'top' : 'bottom',
                    (isTop ? position[1] : (winDim[1] - position[1])) + 'px'
                );
                body.append(popup);

                transclude(function (clone) {
                    popup.append(clone);
                });

                scope.$on('$destroy', function () {
                    popup.remove();
                });
            }

            return {
                restrict: "E",
                transclude: true,
                link: link,
                scope: {}
            };
        }

        return MCTPopup;
    }
);
