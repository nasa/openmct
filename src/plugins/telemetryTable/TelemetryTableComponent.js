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
    'lodash',
    'vue',
    'text!./telemetry-table.html',
    './TelemetryTable',
    './TelemetryTableRowComponent',
    '../../exporters/CSVExporter'
],function (
    _,
    Vue, 
    TelemetryTableTemplate,
    TelemetryTable,
    TelemetryTableRowComponent,
    CSVExporter
) {
    const VISIBLE_ROW_COUNT = 100;
    const ROW_HEIGHT = 17;
    const RESIZE_POLL_INTERVAL = 200;
    const AUTO_SCROLL_TRIGGER_HEIGHT = 20;

    return function TelemetryTableComponent(domainObject, openmct) {
        const csvExporter = new CSVExporter();
        const table = new TelemetryTable(domainObject, VISIBLE_ROW_COUNT, openmct);
        let processingScroll = false;
        let observationUnlistener;

        function defaultConfiguration(domainObject) {
            let configuration = domainObject.configuration;
            configuration.table = configuration.table || {
                columns: {}
            };
            return configuration;
        }

        return new Vue({
            template: TelemetryTableTemplate,
            components: {
                'telemetry-table-row': TelemetryTableRowComponent
            },
            data: function () {
                return {
                    headers: {},
                    configuration: defaultConfiguration(domainObject),
                    headersCount: 0,
                    visibleRows: [],
                    columnWidths: [],
                    sizingRows: {},
                    rowHeight: ROW_HEIGHT,
                    scrollOffset: 0,
                    totalHeight: 0,
                    totalWidth: 0,
                    rowOffset: 0,
                    autoScroll: true,
                    sortOptions: {},
                    filters: {},
                    loading: false,
                    scrollable: undefined,
                    tableEl: undefined,
                    headersHolderEl: undefined,
                    calcTableWidth: '100%'
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
                updateHeaders: function () {
                    let headers = table.configuration.getHeaders();

                    Object.keys(headers).forEach((headerKey) => {
                        if (this.configuration.table.columns[headerKey] === false) {
                            delete headers[headerKey];
                        }
                    });

                    this.headers = headers;
                    this.headersCount = Object.values(headers).length;
                    Vue.nextTick().then(this.calculateColumnWidths);
                },
                setSizingTableWidth: function () {
                    let scrollW = this.scrollable.offsetWidth - this.scrollable.clientWidth;
                    
                    if (scrollW && scrollW > 0) {
                        this.calcTableWidth = 'calc(100% - ' + scrollW + 'px)';
                    }
                },
                calculateColumnWidths: function () {
                    let columnWidths = [];
                    let totalWidth = 0;
                    let sizingRowEl = this.sizingTable.children[0];
                    let sizingCells = Array.from(sizingRowEl.children);

                    sizingCells.forEach((cell) => {
                        let columnWidth = cell.offsetWidth;
                        columnWidths.push(columnWidth + 'px');
                        totalWidth += columnWidth;
                    });

                    this.columnWidths = columnWidths;
                    this.totalWidth = totalWidth;
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

                            if (this.shouldSnapToBottom()) {
                                // If user scrolls away from bottom, disable auto-scroll.
                                // Auto-scroll will be re-enabled if user scrolls to bottom again.
                                this.autoScroll = true;
                            } else {
                                this.autoScroll = false;
                            }

                            processingScroll = false;
                        });
                    }
                },
                shouldSnapToBottom: function () {
                    return this.scrollable.scrollTop >= (this.scrollable.scrollHeight - this.scrollable.offsetHeight - AUTO_SCROLL_TRIGGER_HEIGHT);
                },
                scrollToBottom: function () {
                    this.scrollable.scrollTop = this.totalHeight;
                },
                synchronizeScrollX: function () {
                    this.headersHolderEl.scrollLeft = this.scrollable.scrollLeft;
                },
                filterChanged: function (columnKey) {
                    table.filteredRows.setColumnFilter(columnKey, this.filters[columnKey]);
                },
                clearFilter: function (columnKey) {
                    this.filters[columnKey] = '';
                    table.filteredRows.setColumnFilter(columnKey, '');
                },
                rowsAdded: function (rows) {
                    let sizingRow;
                    if (Array.isArray(rows)) {
                        sizingRow = rows[0];
                    } else {
                        sizingRow = rows;
                    }
                    if (!this.sizingRows[sizingRow.objectKeyString]) {
                        this.sizingRows[sizingRow.objectKeyString] = sizingRow;
                        Vue.nextTick().then(this.calculateColumnWidths);
                    }
                    this.updateVisibleRows();
                    
                    if (this.autoScroll) {
                        this.scrollToBottom();
                    }
                },
                exportAsCSV: function () {
                    const justTheData = table.filteredRows.getRows()
                        .map(row => row.getFormattedDatum());
                    const headers = Object.keys(this.headers);
                    csvExporter.export(justTheData, {
                        filename: table.domainObject.name + '.csv',
                        headers: headers
                    });
                },
                loadingHistoricalData: function (loading) {
                    this.loading = loading;
                },
                calculateTableSize: function () {
                    this.setSizingTableWidth();
                    Vue.nextTick().then(this.calculateColumnWidths);
                },
                pollForResize: function () {
                    let el = this.$el;
                    let width = el.clientWidth;
                    let height = el.clientHeight;

                    this.resizePollHandle = setInterval(() => {
                        if (el.clientWidth !== width || el.clientHeight !== height) {
                            this.calculateTableSize();
                            width = el.clientWidth;
                            height = el.clientHeight;
                        }
                    }, RESIZE_POLL_INTERVAL);
                },
                updateConfiguration: function (configuration) {
                    this.configuration = configuration;
                    this.updateHeaders();
                },
                addObject: function () {
                    this.updateHeaders();
                },
                removeObject: function (objectIdentifier) {
                    let objectKeyString = openmct.objects.makeKeyString(objectIdentifier);
                    delete this.sizingRows[objectKeyString];
                    this.updateHeaders();
                }
            },
            created: function () {
                this.filterChanged = _.debounce(this.filterChanged, 500);
            },
            mounted: function () {
                table.on('object-added', this.addObject);
                table.on('object-removed', this.removeObject);
                table.on('loading-historical-data', this.loadingHistoricalData);

                table.filteredRows.on('add', this.rowsAdded);
                table.filteredRows.on('remove', this.updateVisibleRows);
                table.filteredRows.on('sort', this.updateVisibleRows);
                table.filteredRows.on('filter', this.updateVisibleRows);
                
                //Default sort
                this.sortOptions = table.filteredRows.sortBy();
                this.scrollable = this.$el.querySelector('.t-scrolling');
                this.sizingTable = this.$el.querySelector('.js-sizing-table');
                this.headersHolderEl = this.$el.querySelector('.mct-table-headers-w');

                observationUnlistener = openmct.objects.observe(domainObject, 'configuration', this.updateConfiguration);
                
                this.calculateTableSize();
                this.pollForResize();
            },
            destroyed: function () {
                table.off('object-added', this.addObject);
                table.off('object-removed', this.removeObject);
                table.off('loading-historical-data', this.loadingHistoricalData);

                table.filteredRows.off('add', this.updateVisibleRows);
                table.filteredRows.off('remove', this.updateVisibleRows);
                table.filteredRows.off('sort', this.updateVisibleRows);
                table.filteredRows.off('filter', this.updateVisibleRows);
                clearInterval(this.resizePollHandle);

                observationUnlistener();
                
                table.destroy();
            }
        });
    }
 });