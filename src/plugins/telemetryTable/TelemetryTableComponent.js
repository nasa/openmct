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
    'vue',
    'text!./telemetry-table.html',
    './TelemetryTable',
    './TelemetryTableRowComponent'
],function (
    Vue, 
    TelemetryTableTemplate,
    TelemetryTable,
    TelemetryTableRowComponent
) {
    const VISIBLE_ROW_COUNT = 100;
    const ROW_HEIGHT = 17;

    return function TelemetryTableComponent(domainObject, element, openmct) {
        let table = new TelemetryTable(domainObject, VISIBLE_ROW_COUNT, openmct);
        let processingScroll = false;

        return new Vue({
            el: element,
            template: TelemetryTableTemplate,
            components: {
                'telemetry-table-row': TelemetryTableRowComponent
            },
            data: function () {
                return {
                    headers: {},
                    headersCount: 0,
                    visibleRows: [],
                    columnWidths: [],
                    rowHeight: ROW_HEIGHT,
                    scrollOffset: 0,
                    totalHeight: 0,
                    totalWidth: 0,
                    rowOffset: 0,
                    sortOptions: undefined,
                    sizingRowData: undefined,
                    scrollable: undefined,
                    tableEl: undefined,
                    headersHolderEl: undefined
                }
            },
            methods: {
                updateVisibleRows: function () {
                    let start = 0;
                    let end = VISIBLE_ROW_COUNT;
                    let filteredRows = table.filteredRows.getRows();
                    let filteredRowsLength = filteredRows.length;
                    
                    this.totalHeight = this.rowHeight * filteredRowsLength - 1;
        
                    if (filteredRowsLength < VISIBLE_ROW_COUNT) {
                        end = filteredRowsLength;
                    } else {
                        let firstVisible = this.calculateFirstVisibleRow();
                        let lastVisible = this.calculateLastVisibleRow();
                        let totalVisible = lastVisible - firstVisible;

                        let numberOffscreen = VISIBLE_ROW_COUNT - totalVisible;
                        start = firstVisible - Math.floor(numberOffscreen / 2);
                        end = lastVisible + Math.ceil(numberOffscreen / 2);
        
                        if (start < 0) {
                            start = 0;
                            end = Math.min(VISIBLE_ROW_COUNT, filteredRowsLength);
                        } else if (end >= filteredRowsLength) {
                            end = filteredRowsLength;
                            start = end - VISIBLE_ROW_COUNT + 1;
                        }
                    }
                    this.rowOffset = start;
                    this.visibleRows = filteredRows.slice(start, end);
                },
                calculateFirstVisibleRow: function () {
                    return Math.floor(this.scrollable.scrollTop / this.rowHeight);
                },
                calculateLastVisibleRow: function () {
                    let bottomScroll = this.scrollable.scrollTop + this.scrollable.offsetHeight;
                    return Math.floor(bottomScroll / this.rowHeight);
                },
                updateHeaders: function (headers) {
                    this.headers = headers;
                    this.headersCount = Object.values(headers).length;
                },
                dataLoaded: function () {
                    this.updateSizingRow();
                    this.sortOptions = table.filteredRows.sortBy();
                },
                updateSizingRow: function () {
                    this.sizingRowData = this.visibleRows[0];

                    Vue.nextTick().then(() => {
                        let sizingRowEl = this.sizingTable.children[0];
                        let sizingCells = Array.from(sizingRowEl.children);
                        let paddingFactor = 1.2;
                        let columnWidths = [];
                        let totalWidth = 0;

                        this.columnWidths = [];
                        this.totalWidth = 0;
    
                        sizingCells.forEach((cell) => {
                            let columnWidth = cell.offsetWidth * paddingFactor;
                            columnWidths.push(columnWidth);
                            totalWidth += columnWidth;
                        });

                        this.columnWidths = columnWidths;
                        this.totalWidth = totalWidth;
                    });
                },
                sortBy: function (columnKey) {
                    // If sorting by the same column, flip the sort direction.
                    if (this.sortOptions.key === columnKey) {
                        if (this.sortOptions.direction === 'asc') {
                            this.sortOptions.direction = 'desc';
                        } else {
                            this.sortOptions.direction = 'asc';
                        }
                    } else {
                        this.sortOptions = {
                            key: columnKey,
                            direction: 'asc'
                        }
                    }
                    table.filteredRows.sortBy(this.sortOptions);
                },
                scroll: function() {
                    if (!processingScroll) {
                        processingScroll = true;
                        requestAnimationFrame(() => {
                            this.updateVisibleRows();
                            this.synchronizeScrollX();
                            processingScroll = false;
                        });
                    }
                },
                synchronizeScrollX: function () {
                    this.headersHolderEl.scrollLeft = this.scrollable.scrollLeft;
                },
            },
            mounted: function () {
                table.on('updateHeaders', this.updateHeaders);
                table.on('data-loaded', this.dataLoaded);

                table.filteredRows.on('add', this.updateVisibleRows, this);
                table.filteredRows.on('remove', this.updateVisibleRows, this);
                table.filteredRows.on('sort', this.updateVisibleRows, this);

                this.scrollable = this.$el.querySelector('.t-scrolling');
                this.sizingTable = this.$el.querySelector('.js-sizing-table');
                this.headersHolderEl = this.$el.querySelector('.mct-table-headers-w');
            },
            destroyed: function () {
                table.off('updateHeaders', this.updateHeaders);

                table.filteredRows.off('add', this.updateVisibleRows, this);
                table.filteredRows.off('remove', this.updateVisibleRows, this);
                table.filteredRows.off('sort', this.updateVisibleRows, this);
            }
        });
    }
 });