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

/**
 * Module defining FullscreenAction. Created by vwoeltje on 11/18/14.
 */
define(
    ["screenfull"],
    function (screenfull) {

        var ENTER_FULLSCREEN = "Enter full screen mode",
            EXIT_FULLSCREEN = "Exit full screen mode";

        /**
         * The fullscreen action toggles between fullscreen display
         * and regular in-window display.
         * @memberof platform/commonUI/browse
         * @constructor
         * @implements {Action}
         */
        function FullscreenAction(context) {
            this.context = context;
        }

        FullscreenAction.prototype.perform = function () {
            screenfull.toggle();
        };

        FullscreenAction.prototype.getMetadata = function () {
            // We override getMetadata, because the icon cssClass and
            // description need to be determined at run-time
            // based on whether or not we are currently
            // full screen.
            var metadata = Object.create(FullscreenAction);
            metadata.cssClass = screenfull.isFullscreen ? "icon-fullscreen-expand" : "icon-fullscreen-collapse";
            metadata.description = screenfull.isFullscreen ?
                EXIT_FULLSCREEN : ENTER_FULLSCREEN;
            metadata.group = "windowing";
            metadata.context = this.context;
            return metadata;
        };

        return FullscreenAction;
    }
);
