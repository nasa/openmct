/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2017, United States Government
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
    [],
    function () {

        var PREVIEW_TEMPLATE = '<mct-representation key="\'mct-preview\'"' +
                                    'class="t-rep-frame holder"' +
                                    'mct-object="selObj">' +
                                '</mct-representation>';

        function MCTPreview($compile,$rootScope,dialogService,notificationService,linkService,context) {
            context = context || {};
            this.domainObject = context.selectedObject || context.domainObject;
            this.dialogService = dialogService;
            this.notificationService = notificationService;
            this.linkService = linkService;
            this.$rootScope = $rootScope;
            this.$compile = $compile;
        }

        MCTPreview.prototype.perform = function (object) {
            var domainObj = object || this.domainObject,
                rootScope = this.$rootScope;

            rootScope.newEntryText = '';
            this.$rootScope.selObj = domainObj;
            this.$rootScope.selValue = "";

            var newScope = rootScope.$new();
            newScope.selObj = domainObj;
            newScope.selValue = "";

            this.$compile(PREVIEW_TEMPLATE)(newScope);
        };

        MCTPreview.appliesTo = function (context) {
            var domainObject = (context || {}).domainObject,
                status = domainObject.getCapability('status');

            return !(status && status.get('editing'));
        };

        return MCTPreview;
    }
);
