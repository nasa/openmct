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

define([
    './AutoflowTabularController',
    './AutoflowTabularConstants',
    './VueView',
    './autoflow-tabular.html'
], function (
    AutoflowTabularController,
    AutoflowTabularConstants,
    VueView,
    autoflowTemplate
) {
    var ROW_HEIGHT = AutoflowTabularConstants.ROW_HEIGHT;
    var SLIDER_HEIGHT = AutoflowTabularConstants.SLIDER_HEIGHT;
    var INITIAL_COLUMN_WIDTH = AutoflowTabularConstants.INITIAL_COLUMN_WIDTH;
    var MAX_COLUMN_WIDTH = AutoflowTabularConstants.MAX_COLUMN_WIDTH;
    var COLUMN_WIDTH_STEP = AutoflowTabularConstants.COLUMN_WIDTH_STEP;

    /**
     * Implements the Autoflow Tabular view of a domain object.
     */
    function AutoflowTabularView(domainObject, openmct) {
        var data = {
            items: [],
            columns: [],
            width: INITIAL_COLUMN_WIDTH,
            filter: "",
            updated: "No updates",
            rowCount: 1
        };
        var controller =
            new AutoflowTabularController(domainObject, data, openmct);
        var interval;

        VueView.call(this, {
            data: data,
            methods: {
                increaseColumnWidth: function () {
                    data.width += COLUMN_WIDTH_STEP;
                    data.width = data.width > MAX_COLUMN_WIDTH ?
                        INITIAL_COLUMN_WIDTH : data.width;
                },
                reflow: function () {
                    var column = [];
                    var index = 0;
                    var filteredItems =
                        data.items.filter(function (item) {
                            return item.name.toLowerCase()
                                .indexOf(data.filter.toLowerCase()) !== -1;
                        });

                    data.columns = [];

                    while (index < filteredItems.length) {
                        if (column.length >= data.rowCount) {
                            data.columns.push(column);
                            column = [];
                        }

                        column.push(filteredItems[index]);
                        index += 1;
                    }

                    if (column.length > 0) {
                        data.columns.push(column);
                    }
                }
            },
            watch: {
                filter: 'reflow',
                items: 'reflow',
                rowCount: 'reflow'
            },
            template: autoflowTemplate,
            destroyed: function () {
                controller.destroy();

                if (interval) {
                    clearInterval(interval);
                    interval = undefined;
                }
            },
            mounted: function () {
                controller.activate();

                var updateRowHeight = function () {
                    var tabularArea = this.$refs.autoflowItems;
                    var height = tabularArea ? tabularArea.clientHeight : 0;
                    var available = height - SLIDER_HEIGHT;
                    var rows = Math.max(1, Math.floor(available / ROW_HEIGHT));
                    data.rowCount = rows;
                }.bind(this);

                interval = setInterval(updateRowHeight, 50);
                this.$nextTick(updateRowHeight);
            }
        });
    }

    AutoflowTabularView.prototype = Object.create(VueView.prototype);

    return AutoflowTabularView;
});

