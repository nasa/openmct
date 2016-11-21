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

define(['zepto', './InspectorPanelView'], function ($, InspectorPanelView) {
    function InspectorView(registry, context) {
        this.registry = registry;
        this.context = context;
        this.views = [];
    }

    InspectorView.prototype.show = function (element) {
        var providers = this.registry.get(this.context);
        var $ul = $('<ul></ul>');

        this.destroy();

        this.views = providers.map(function (provider) {
            return new InspectorPanelView(provider, this.context);
        }.bind(this));

        $(element).append($ul);

        this.views.foreEach(function (view) {
            view.show($ul[0]);
        });
    };

    InspectorView.prototype.destroy = function () {
        this.views.forEach(function (view) {
            view.destroy();
        });
        this.views = [];
    };

    return InspectorView;
});
