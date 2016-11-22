/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2016, United States Government
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
var electron = nodeRequire('electron');
/**
 * Module defining NewWindowAction (Originally NewWindowAction). Created by vwoeltje on 11/18/14.
 */
define(
    [],
    function () {
        /**
         * The new tab action allows a domain object to be opened
         * into a new browser tab.
         * @memberof platform/commonUI/browse
         * @constructor
         * @implements {Action}
         */
        function NewWindowAction(urlService, context) {
            context = context || {};
            var windae = undefined;
            this.urlService = urlService;
            this.open = function (url) {
                windae = new electron.remote.BrowserWindow({width: 800, height: 600});
                windae.on('close', function () {
                    windae = null;
                });
                var url =  ['file:/', __dirname, url].join('/') + "&synced=" + !!this.synced;
                windae.loadURL(url);
            };

            // Choose the object to be opened into a new tab
            this.domainObject = context.selectedObject || context.domainObject;
        }

        NewWindowAction.prototype.perform = function () {
            this.open(
                this.urlService.urlForNewTab("window", this.domainObject),
                "_blank"
            );
        };

        return NewWindowAction;
    }
);
