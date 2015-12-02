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
    [],
    function () {
        'use strict';

        /**
         * The `mct-refresh` directive may be used to explicitly
         * trigger the refresh of the contents of the HTML element
         * which has this attribute. When used in combination with
         * one-time binding, this allows templates (or sections thereof)
         * to eschew watches and instead use other strategies for
         * change detection.
         *
         * The `mct-refresh` directive is applied as an attribute
         * whose value should be an Angular expression which:
         *
         * * Will be evaluated with a variable `callback`, which is
         *   a function that, when invoked, will trigger a refresh.
         * * May return a function which will be invoked by `mct-refresh`
         *   when the directive is no longer applicable; this should
         *   be used to release any resources associated with the
         *   above callback.
         *
         * Example usage:
         *
         * ```
         * <span mct-refresh="someObservable.observe(callback)">
         *     <div>{{::someObservable.getValue()}}</div>
         * </span>
         * ```
         *
         * @constructor
         * @memberof platform/commonUI/general
         */
        function MCTRefresh() {

            function link(scope, elem, attrs, ctrl, transclude) {
                var unlisten;

                function recreateContents() {
                    transclude(function (clone) {
                        elem.empty();
                        elem.append(clone);
                    });
                }

                recreateContents();

                unlisten = scope.$eval(
                    attrs.mctRefresh,
                    { callback: recreateContents }
                );

                if (unlisten) {
                    scope.$on("$destroy", unlisten);
                }
            }

            return {
                transclude: true,
                link: link
            };
        }

        return MCTRefresh;
    }
);
