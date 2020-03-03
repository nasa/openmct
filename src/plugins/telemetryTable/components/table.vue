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
<template>
<div class="c-table-wrapper">
    <!-- main contolbar  start-->
    <div v-if="!marking.useAlternateControlBar"
         class="c-table-control-bar c-control-bar"
    >
        <button
            v-if="allowExport"
            class="c-button icon-download labeled"
            title="Export This View's Data"
            @click="exportAllDataAsCSV()"
        >
            <span class="c-button__label">Export Table Data</span>
        </button>
        <button
            v-if="allowExport"
            v-show="markedRows.length"
            class="c-button icon-download labeled"
            title="Export Marked Rows As CSV"
            @click="exportMarkedDataAsCSV()"
        >
            <span class="c-button__label">Export Marked Rows</span>
        </button>
        <button
            v-show="markedRows.length"
            class="c-button icon-x labeled"
            title="Unmark All Rows"
            @click="unmarkAllRows()"
        >
            <span class="c-button__label">Unmark All Rows</span>
        </button>
        <div
            v-if="marking.enable"
            class="c-separator"
        ></div>
        <button
            v-if="marking.enable"
            class="c-button icon-pause pause-play labeled"
            :class=" paused ? 'icon-play is-paused' : 'icon-pause'"
            :title="paused ? 'Continue Data Flow' : 'Pause Data Flow'"
            @click="togglePauseByButton()"
        >
            <span class="c-button__label">
                {{ paused ? 'Play' : 'Pause' }}
            </span>
        </button>
        <div
            class="c-separator"
        ></div>
        <button
            class="c-button icon-refresh labeled"
            @click="recalculateColumnWidths">
            <span class="c-button__label">Recalculate Column Width's</span>
        </button>

        <slot name="buttons"></slot>
    </div>
    <!-- main controlbar end -->

    <!-- alternate controlbar start -->
    <div v-if="marking.useAlternateControlBar && markedRows.length"
         class="c-table-control-bar c-control-bar"
    >
        <div class="c-control-bar__label">
            {{ markedRows.length > 1 ? `${markedRows.length} ${marking.rowNamePlural} selected`: `${markedRows.length} ${marking.rowName} selected` }}
        </div>

        <toggle-switch
            id="show-filtered-rows-toggle"
            label="Show selected items only"
            :checked="isShowingMarkedRowsOnly"
            @change="toggleMarkedRows"
        />

        <button
            class="c-button icon-x labeled"
            title="Deselect All"
            @click="unmarkAllRows()"
        >
            <span class="c-button__label">Deselect All</span>
        </button>

        <slot name="buttons"></slot>
    </div>
    <!-- alternate controlbar end  -->

    <div
        class="c-table c-telemetry-table c-table--filterable c-table--sortable has-control-bar"
        :class="{
            'loading': loading,
            'paused' : paused
        }"
    >
        <div :style="{ 'max-width': widthWithScroll, 'min-width': '150px'}">
            <slot></slot>
        </div>

        <div
            v-if="isDropTargetActive"
            class="c-telemetry-table__drop-target"
            :style="dropTargetStyle"
        ></div>
        <!-- Headers table -->
        <div
            ref="headersTable"
            class="c-telemetry-table__headers-w js-table__headers-w"
            :style="{ 'max-width': widthWithScroll}"
        >
            <table class="c-table__headers c-telemetry-table__headers">
                <thead>
                    <tr class="c-telemetry-table__headers__labels">
                        <table-column-header
                            v-for="(title, key, headerIndex) in headers"
                            :key="key"
                            :header-key="key"
                            :header-index="headerIndex"
                            :column-width="columnWidths[key]"
                            :sort-options="sortOptions"
                            :is-editing="isEditing"
                            @sort="allowSorting && sortBy(key)"
                            @resizeColumn="resizeColumn"
                            @dropTargetOffsetChanged="setDropTargetOffset"
                            @dropTargetActive="dropTargetActive"
                            @reorderColumn="reorderColumn"
                            @resizeColumnEnd="updateConfiguredColumnWidths"
                        >
                            <span class="c-telemetry-table__headers__label">{{ title }}</span>
                        </table-column-header>
                    </tr>
                    <tr
                        v-if="allowFiltering"
                        class="c-telemetry-table__headers__filter"
                    >
                        <table-column-header
                            v-for="(title, key, headerIndex) in headers"
                            :key="key"
                            :header-key="key"
                            :header-index="headerIndex"
                            :column-width="columnWidths[key]"
                            :is-editing="isEditing"
                            @resizeColumn="resizeColumn"
                            @dropTargetOffsetChanged="setDropTargetOffset"
                            @dropTargetActive="dropTargetActive"
                            @reorderColumn="reorderColumn"
                            @resizeColumnEnd="updateConfiguredColumnWidths"
                        >
                            <search
                                v-model="filters[key]"
                                class="c-table__search"
                                @input="filterChanged(key)"
                                @clear="clearFilter(key)"
                            />
                        </table-column-header>
                    </tr>
                </thead>
            </table>
        </div>
        <!-- Content table -->
        <div
            class="c-table__body-w c-telemetry-table__body-w js-telemetry-table__body-w"
            :style="{ 'max-width': widthWithScroll}"
            @scroll="scroll"
        >
            <div
                class="c-telemetry-table__scroll-forcer"
                :style="{ width: totalWidth + 'px' }"
            ></div>
            <table
                class="c-table__body c-telemetry-table__body js-telemetry-table__content"
                :style="{ height: totalHeight + 'px'}"
            >
                <tbody>
                    <telemetry-table-row
                        v-for="(row, rowIndex) in visibleRows"
                        :key="rowIndex"
                        :headers="headers"
                        :column-widths="columnWidths"
                        :row-index="rowIndex"
                        :object-path="objectPath"
                        :row-offset="rowOffset"
                        :row-height="rowHeight"
                        :row="row"
                        :marked="row.marked"
                        @mark="markRow"
                        @unmark="unmarkRow"
                        @markMultipleConcurrent="markMultipleConcurrentRows"
                    />
                </tbody>
            </table>
        </div>
        <!-- Sizing table -->
        <table
            class="c-telemetry-table__sizing js-telemetry-table__sizing"
            :style="sizingTableWidth"
        >
            <tr>
                <template v-for="(title, key) in headers">
                    <th
                        :key="key"
                        :style="{ width: configuredColumnWidths[key] + 'px', 'max-width': configuredColumnWidths[key] + 'px'}"
                    >
                        {{ title }}
                    </th>
                </template>
            </tr>
            <telemetry-table-row
                v-for="(sizingRowData, objectKeyString) in sizingRows"
                :key="objectKeyString"
                :headers="headers"
                :column-widths="configuredColumnWidths"
                :row="sizingRowData"
                :object-path="objectPath"
            />
        </table>
        <telemetry-filter-indicator />
    </div>
</div><!-- closes c-table-wrapper -->
</template>

<script>
import TelemetryTableRow from './table-row.vue';
import search from '../../../ui/components/search.vue';
import TableColumnHeader from './table-column-header.vue';
import TelemetryFilterIndicator from './TelemetryFilterIndicator.vue';
import CSVExporter from '../../../exporters/CSVExporter.js';
import _ from 'lodash';
import ToggleSwitch from '../../../ui/components/ToggleSwitch.vue';

const VISIBLE_ROW_COUNT = 100;
const ROW_HEIGHT = 17;
const RESIZE_POLL_INTERVAL = 200;
const AUTO_SCROLL_TRIGGER_HEIGHT = 100;

export default {
    components: {
        TelemetryTableRow,
        TableColumnHeader,
        search,
        TelemetryFilterIndicator,
        ToggleSwitch
    },
    inject: ['table', 'openmct', 'objectPath'],
    props: {
        isEditing: {
            type: Boolean,
            default: false
        },
        allowExport: {
            type: Boolean,
            default: true
        },
        allowFiltering: {
            'type': Boolean,
            'default': true
        },
        allowSorting: {
            'type': Boolean,
            'default': true
        },
        marking: {
            type: Object,
            default() {
                return {
                    enable: false,
                    useAlternateControlBar: false,
                    rowName: '',
                    rowNamePlural: ""
                }
            }
        }
    },
    data() {
        let configuration = this.table.configuration.getConfiguration();

        return {
            headers: {},
            visibleRows: [],
            columnWidths: {},
            configuredColumnWidths: configuration.columnWidths,
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
            processingScroll: false,
            updatingView: false,
            dropOffsetLeft: undefined,
            isDropTargetActive: false,
            isAutosizeEnabled: configuration.autosize,
            scrollW: 0,
            markCounter: 0,
            paused: false,
            markedRows: [],
            isShowingMarkedRowsOnly: false
        }
    },
    computed: {
        dropTargetStyle() {
            return {
                top: this.$refs.headersTable.offsetTop + 'px',
                height: this.totalHeight + this.$refs.headersTable.offsetHeight + 'px',
                left: this.dropOffsetLeft && this.dropOffsetLeft + 'px'
            }
        },
        lastHeaderKey() {
            let headerKeys = Object.keys(this.headers);
            return headerKeys[headerKeys.length - 1];
        },
        widthWithScroll() {
            return this.totalWidth + this.scrollW + "px";
        },
        sizingTableWidth() {
            let style;

            if (this.isAutosizeEnabled) {
                style = { width: "calc(100% - " + this.scrollW + "px)" };
            } else {
                let totalWidth = Object.keys(this.headers).reduce((total, key) => {
                    total += this.configuredColumnWidths[key];
                    return total;
                }, 0);

                style = {width: totalWidth + 'px'};
            }
            return style;
        }
    },
    watch: {
        markedRows: {
            handler(newVal, oldVal) {
                this.$emit('marked-rows-updated', newVal, oldVal);
            }
        }
    },
    created() {
        this.filterChanged = _.debounce(this.filterChanged, 500);
    },
    mounted() {
        this.csvExporter = new CSVExporter();
        this.rowsAdded = _.throttle(this.rowsAdded, 200);
        this.rowsRemoved = _.throttle(this.rowsRemoved, 200);
        this.scroll = _.throttle(this.scroll, 100);

        this.table.on('object-added', this.addObject);
        this.table.on('object-removed', this.removeObject);
        this.table.on('outstanding-requests', this.outstandingRequests);
        this.table.on('refresh', this.clearRowsAndRerender);
        this.table.on('historical-rows-processed', this.checkForMarkedRows);

        this.table.filteredRows.on('add', this.rowsAdded);
        this.table.filteredRows.on('remove', this.rowsRemoved);
        this.table.filteredRows.on('sort', this.updateVisibleRows);
        this.table.filteredRows.on('filter', this.updateVisibleRows);

        //Default sort
        this.sortOptions = this.table.filteredRows.sortBy();
        this.scrollable = this.$el.querySelector('.js-telemetry-table__body-w');
        this.contentTable = this.$el.querySelector('.js-telemetry-table__content');
        this.sizingTable = this.$el.querySelector('.js-telemetry-table__sizing');
        this.headersHolderEl = this.$el.querySelector('.js-table__headers-w');

        this.table.configuration.on('change', this.updateConfiguration);

        this.calculateTableSize();
        this.pollForResize();
        this.calculateScrollbarWidth();

        this.table.initialize();
    },
    destroyed() {
        this.table.off('object-added', this.addObject);
        this.table.off('object-removed', this.removeObject);
        this.table.off('outstanding-requests', this.outstandingRequests);
        this.table.off('refresh', this.clearRowsAndRerender);

        this.table.filteredRows.off('add', this.rowsAdded);
        this.table.filteredRows.off('remove', this.rowsRemoved);
        this.table.filteredRows.off('sort', this.updateVisibleRows);
        this.table.filteredRows.off('filter', this.updateVisibleRows);

        this.table.configuration.off('change', this.updateConfiguration);

        clearInterval(this.resizePollHandle);

        this.table.configuration.destroy();

        this.table.destroy();
    },
    methods: {
        updateVisibleRows() {
            if (!this.updatingView) {
                this.updatingView = true;
                requestAnimationFrame(()=> {

                    let start = 0;
                    let end = VISIBLE_ROW_COUNT;
                    let filteredRows = this.table.filteredRows.getRows();
                    let filteredRowsLength = filteredRows.length;

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

                    this.updatingView = false;
                });
            }
        },
        calculateFirstVisibleRow() {
            let scrollTop = this.scrollable.scrollTop;
            return Math.floor(scrollTop / this.rowHeight);
        },
        calculateLastVisibleRow() {
            let scrollBottom = this.scrollable.scrollTop + this.scrollable.offsetHeight;
            return Math.ceil(scrollBottom / this.rowHeight);
        },
        updateHeaders() {
            this.headers = this.table.configuration.getVisibleHeaders();
        },
        calculateScrollbarWidth() {
            // Scroll width seems to vary by a pixel for reasons that are not clear.
            this.scrollW = (this.scrollable.offsetWidth - this.scrollable.clientWidth) + 1;
        },
        calculateColumnWidths() {
            let columnWidths = {};
            let totalWidth = 0;
            let headerKeys = Object.keys(this.headers);
            let sizingTableChildren = Array.from(this.sizingTable.children);

            headerKeys.forEach((headerKey, headerIndex)=>{
                sizingTableChildren.forEach(sizingRowEl => {
                    let sizingCells = Array.from(sizingRowEl.children),
                        cell = sizingCells[headerIndex];

                    if (columnWidths[headerKey]) {
                        let currentWidth = columnWidths[headerKey],
                            newWidth = cell.offsetWidth;
                        
                        if (newWidth > currentWidth) {
                            columnWidths[headerKey] = newWidth;
                        }
                    } else {
                        columnWidths[headerKey] = cell.offsetWidth;
                    }
                });
                totalWidth += columnWidths[headerKey];
            });

            this.columnWidths = columnWidths;
            this.totalWidth = totalWidth;

            this.calculateScrollbarWidth();

            return Promise.resolve();
        },
        sortBy(columnKey) {
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
            this.table.sortBy(this.sortOptions);
        },
        scroll() {
            this.updateVisibleRows();
            this.synchronizeScrollX();

            if (this.shouldSnapToBottom()) {
                this.autoScroll = true;
            } else {
                // If user scrolls away from bottom, disable auto-scroll.
                // Auto-scroll will be re-enabled if user scrolls to bottom again.
                this.autoScroll = false;
            }
        },
        shouldSnapToBottom() {
            return this.scrollable.scrollTop >= (this.scrollable.scrollHeight - this.scrollable.offsetHeight - AUTO_SCROLL_TRIGGER_HEIGHT);
        },
        scrollToBottom() {
            this.scrollable.scrollTop = Number.MAX_SAFE_INTEGER;
        },
        synchronizeScrollX() {
            this.headersHolderEl.scrollLeft = this.scrollable.scrollLeft;
        },
        filterChanged(columnKey) {
            this.table.filteredRows.setColumnFilter(columnKey, this.filters[columnKey]);
            this.setHeight();
        },
        clearFilter(columnKey) {
            this.filters[columnKey] = '';
            this.table.filteredRows.setColumnFilter(columnKey, '');
            this.setHeight();
        },
        rowsAdded(rows) {
            this.setHeight();

            let sizingRow;
            if (Array.isArray(rows)) {
                sizingRow = rows[0];
            } else {
                sizingRow = rows;
            }

            if (!this.sizingRows[sizingRow.objectKeyString]) {
                this.sizingRows[sizingRow.objectKeyString] = sizingRow;
                this.$nextTick().then(this.calculateColumnWidths);
            }

            if (this.autoScroll) {
                this.scrollToBottom();
            }

            this.updateVisibleRows();
        },
        rowsRemoved(rows) {
            this.setHeight();
            this.updateVisibleRows();
        },
        /**
         * Calculates height based on total number of rows, and sets table height.
         */
        setHeight() {
            let filteredRowsLength = this.table.filteredRows.getRows().length;
            this.totalHeight = this.rowHeight * filteredRowsLength - 1;
            // Set element height directly to avoid having to wait for Vue to update DOM
            // which causes subsequent scroll to use an out of date height.
            this.contentTable.style.height = this.totalHeight + 'px';
        },
        exportAsCSV(data) {
            const headerKeys = Object.keys(this.headers);

            this.csvExporter.export(data, {
                filename: this.table.domainObject.name + '.csv',
                headers: headerKeys
            });
        },
        exportAllDataAsCSV() {
            const justTheData = this.table.filteredRows.getRows()
                .map(row => row.getFormattedDatum(this.headers));

            this.exportAsCSV(justTheData);
        },
        exportMarkedDataAsCSV() {
            const data = this.table.filteredRows.getRows()
                .filter(row => row.marked === true)
                .map(row => row.getFormattedDatum(this.headers));

            this.exportAsCSV(data);
        },
        outstandingRequests(loading) {
            this.loading = loading;
        },
        calculateTableSize() {
            this.$nextTick().then(this.calculateColumnWidths);
        },
        updateConfiguration(configuration) {
            this.isAutosizeEnabled = configuration.autosize;

            this.updateHeaders();
            this.$nextTick().then(this.calculateColumnWidths);
        },
        addObject() {
            this.updateHeaders();
            this.$nextTick().then(this.calculateColumnWidths);
        },
        removeObject(objectIdentifier) {
            let objectKeyString = this.openmct.objects.makeKeyString(objectIdentifier);
            delete this.sizingRows[objectKeyString];
            this.updateHeaders();
            this.$nextTick().then(this.calculateColumnWidths);
        },
        resizeColumn(key, newWidth) {
            let delta = newWidth - this.columnWidths[key];
            this.columnWidths[key] = newWidth;
            this.totalWidth += delta;
        },
        updateConfiguredColumnWidths() {
            this.configuredColumnWidths = this.columnWidths;

            let configuration = this.table.configuration.getConfiguration();
            configuration.autosize = false;
            configuration.columnWidths = this.configuredColumnWidths;

            this.table.configuration.updateConfiguration(configuration);
        },
        setDropTargetOffset(dropOffsetLeft) {
            this.dropOffsetLeft = dropOffsetLeft - this.scrollable.scrollLeft;
        },
        reorderColumn(from, to) {
            let newHeaderKeys = Object.keys(this.headers);
            let moveFromKey = newHeaderKeys[from];

            if (to < from) {
                newHeaderKeys.splice(from, 1);
                newHeaderKeys.splice(to, 0, moveFromKey);
            } else {
                newHeaderKeys.splice(from, 1);
                newHeaderKeys.splice(to, 0, moveFromKey);
            }

            let newHeaders = newHeaderKeys.reduce((headers, headerKey)=>{
                headers[headerKey] = this.headers[headerKey];
                return headers;
            }, {});

            this.table.configuration.setColumnOrder(Object.keys(newHeaders));

            this.headers = newHeaders;
            this.dropOffsetLeft = undefined;

            this.dropTargetActive(false);
        },
        dropTargetActive(isActive) {
            this.isDropTargetActive = isActive;
        },
        pollForResize() {
            let el = this.$el;
            let width = el.clientWidth;
            let height = el.clientHeight;
            let scrollTop = this.scrollable.scrollTop;

            this.resizePollHandle = setInterval(() => {
                if ((el.clientWidth !== width || el.clientHeight !== height) && this.isAutosizeEnabled) {
                    this.calculateTableSize();
                    // On some resize events scrollTop is reset to 0. Possibly due to a transition we're using?
                    // Need to preserve scroll position in this case.
                    if (this.autoScroll) {
                        this.scrollToBottom();
                    } else {
                        this.scrollable.scrollTop = scrollTop;
                    }
                    width = el.clientWidth;
                    height = el.clientHeight;
                }
                scrollTop = this.scrollable.scrollTop;
            }, RESIZE_POLL_INTERVAL);
        },
        clearRowsAndRerender() {
            this.visibleRows = [];
            this.$nextTick().then(this.updateVisibleRows);
        },
        pause(pausedByButton) {
            if (pausedByButton) {
                this.pausedByButton = true;
            }
            this.paused = true;
            this.table.pause();
        },
        unpause(unpausedByButton) {
            if (unpausedByButton) {
                this.undoMarkedRows();
                this.table.unpause();
                this.paused = false;
                this.pausedByButton = false;
            } else {
                if (!this.pausedByButton) {
                    this.undoMarkedRows();
                    this.table.unpause();
                    this.paused = false;
                }
            }

            this.isShowingMarkedRowsOnly = false;
        },
        togglePauseByButton() {
            if (this.paused) {
                this.unpause(true);
            } else {
                this.pause(true);
            }
        },
        undoMarkedRows(unpause) {
            this.markedRows.forEach(r => r.marked = false);
            this.markedRows = [];
        },
        unmarkRow(rowIndex) {
            if (this.markedRows.length > 1) {
                let row = this.visibleRows[rowIndex],
                    positionInMarkedArray = this.markedRows.indexOf(row);

                row.marked = false;
                this.markedRows.splice(positionInMarkedArray, 1);
            } else if (this.markedRows.length === 1) {
                this.unmarkAllRows();
            }

            if (this.markedRows.length === 0) {
                this.unpause();
            }
        },
        markRow(rowIndex, keyModifier) {
            if (!this.marking.enable) {
                return;
            }

            let insertMethod = 'unshift';

            if (this.markedRows.length && !keyModifier) {
                this.undoMarkedRows();
                insertMethod = 'push';
            }

            let markedRow = this.visibleRows[rowIndex];

            this.$set(markedRow, 'marked', true);
            this.pause();

            this.markedRows[insertMethod](markedRow);
        },
        unmarkAllRows(skipUnpause) {
            this.undoMarkedRows();
            this.isShowingMarkedRowsOnly = false;
            this.unpause();
            this.restorePreviousRows();
        },
        markMultipleConcurrentRows(rowIndex) {
            if (!this.marking.enable) {
                return;
            }

            if (!this.markedRows.length) {
                this.markRow(rowIndex);
            } else {
                if (this.markedRows.length > 1) {
                    this.markedRows.forEach((r,i) => {
                        if (i !== 0) {
                            r.marked = false;
                        }
                    });
                    this.markedRows.splice(1);
                }
                let lastRowToBeMarked = this.visibleRows[rowIndex];

                let allRows = this.table.filteredRows.getRows(),
                    firstRowIndex = allRows.indexOf(this.markedRows[0]),
                    lastRowIndex = allRows.indexOf(lastRowToBeMarked);

                //supports backward selection
                if (lastRowIndex < firstRowIndex) {
                    [firstRowIndex, lastRowIndex] = [lastRowIndex, firstRowIndex];
                }

                let baseRow = this.markedRows[0];

                for (var i = firstRowIndex; i <= lastRowIndex; i++) {
                    let row = allRows[i];
                    row.marked = true;

                    if (row !== baseRow) {
                        this.markedRows.push(row);
                    }
                }
            }
        },
        checkForMarkedRows() {
            this.isShowingMarkedRowsOnly = false;
            this.markedRows = this.table.filteredRows.getRows().filter(row => row.marked);
        },
        showRows(rows) {
            this.table.filteredRows.rows = rows;
            this.table.filteredRows.emit('filter');
        },
        toggleMarkedRows(flag) {
            if (flag) {
                this.isShowingMarkedRowsOnly = true;
                this.userScroll = this.scrollable.scrollTop;
                this.allRows = this.table.filteredRows.getRows();

                this.showRows(this.markedRows);
                this.setHeight();
            } else {
                this.isShowingMarkedRowsOnly = false;
                this.restorePreviousRows();
            }
        },
        restorePreviousRows() {
            if (this.allRows && this.allRows.length) {
                this.showRows(this.allRows);
                this.allRows = [];
                this.setHeight();
                this.scrollable.scrollTop = this.userScroll;
            }
        },
        clearSizingTable() {
            this.visibleRows.forEach((row, i) => {
                delete this.sizingRows[i];
            });
        },
        recalculateColumnWidths() {
            this.visibleRows.forEach((row,i) => {
                this.$set(this.sizingRows, i, row);
            });

            this.$nextTick()
                .then(this.calculateColumnWidths)
                .then(this.clearSizingTable);
        }
    }
}
</script>
