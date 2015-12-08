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
 * This bundle provides various general-purpose UI elements, including
 * platform styling.
 * @namespace platform/commonUI/general
 */
define(
    [],
    function () {
        "use strict";

        var WARNING_TITLE = "Unsupported browser",
            WARNING_DESCRIPTION = [
                "This software has been developed and tested",
                "using the latest Google Chrome,",
                "and may be unstable in other browsers."
            ].join(" "),
            MOBILE_BROWSER = "Safari",
            DESKTOP_BROWSER = "Chrome";

        /**
         * Shows a warning if a user's browser is unsupported.
         * @memberof platform/commonUI/general
         * @constructor
         * @param {NotificationService} notificationService the notification
         *        service
         */
        function UnsupportedBrowserWarning(notificationService, agentService) {
            var testToBrowser = agentService.isMobile() ?
                    MOBILE_BROWSER : DESKTOP_BROWSER;

            if (!agentService.isBrowser(testToBrowser)) {
                notificationService.alert({
                    title: WARNING_TITLE,
                    actionText: WARNING_DESCRIPTION
                });
            }
        }

        return UnsupportedBrowserWarning;
    }
);
