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
    <div class="c-table-control-bar c-control-bar">
        <button class="c-button icon-download labeled"
           v-on:click="exportAllDataAsCSV()"
           title="Export This View's Data">
            <span class="c-button__label">Export Table Data</span>
        </button>
        <button class="c-button icon-download labeled"
            v-show="markedRows.length"
            v-on:click="exportMarkedDataAsCSV()"
            title="Export Marked Rows As CSV">
            <span class="c-button__label">Export Marked Rows</span>
        </button>
        <button class="c-button icon-x labeled"
            v-show="markedRows.length"
            v-on:click="unmarkAllRows()"
            title="Unmark All Rows">
            <span class="c-button__label">Unmark All Rows</span>
        </button>
        <div class="c-separator"></div>
        <button class="c-button icon-pause pause-play labeled"
                :class=" paused ? 'icon-play is-paused' : 'icon-pause'"
            v-on:click="togglePauseByButton()"
            :title="paused ? 'Continue Data Flow' : 'Pause Data Flow'">
            <span class="c-button__label">
                {{paused ? 'Play' : 'Pause'}}
            </span>
        </button>
    </div>

    <div class="c-table c-telemetry-table c-table--filterable c-table--sortable has-control-bar"
         :class="{
         'loading': loading,
         'paused' : paused
        }">
        <div v-if="isDropTargetActive" class="c-telemetry-table__drop-target" :style="dropTargetStyle"></div>
        <!-- Headers table -->
        <div class="c-telemetry-table__headers-w js-table__headers-w" ref="headersTable" :style="{ 'max-width': widthWithScroll}">
            <table class="c-table__headers c-telemetry-table__headers">
                <thead>
                    <tr class="c-telemetry-table__headers__labels">
                        <table-column-header
                            v-for="(title, key, headerIndex) in headers"
                            :key="key"
                            :headerKey="key"
                            :headerIndex="headerIndex"
                            @sort="sortBy(key)"
                            @resizeColumn="resizeColumn"
                            @dropTargetOffsetChanged="setDropTargetOffset"
                            @dropTargetActive="dropTargetActive"
                            @reorderColumn="reorderColumn"
                            @resizeColumnEnd="updateConfiguredColumnWidths"
                            :columnWidth="columnWidths[key]"
                            :sortOptions="sortOptions"
                            :isEditing="isEditing"
                        ><span class="c-telemetry-table__headers__label">{{title}}</span>
                        </table-column-header>
                    </tr>
                    <tr class="c-telemetry-table__headers__filter">
                        <table-column-header
                            v-for="(title, key, headerIndex) in headers"
                            :key="key"
                            :headerKey="key"
                            :headerIndex="headerIndex"
                            @resizeColumn="resizeColumn"
                            @dropTargetOffsetChanged="setDropTargetOffset"
                            @dropTargetActive="dropTargetActive"
                            @reorderColumn="reorderColumn"
                            @resizeColumnEnd="updateConfiguredColumnWidths"
                            :columnWidth="columnWidths[key]"
                            :isEditing="isEditing"
                            >
                            <search class="c-table__search"
                                v-model="filters[key]"
                                v-on:input="filterChanged(key)"
                                v-on:clear="clearFilter(key)" />
                        </table-column-header>
                    </tr>
                </thead>
            </table>
        </div>
        <!-- Content table -->
        <div class="c-table__body-w c-telemetry-table__body-w js-telemetry-table__body-w" @scroll="scroll" :style="{ 'max-width': widthWithScroll}">
            <div class="c-telemetry-table__scroll-forcer" :style="{ width: totalWidth + 'px' }"></div>
            <table class="c-table__body c-telemetry-table__body js-telemetry-table__content"
                   :style="{ height: totalHeight + 'px'}">
                <tbody>
                    <telemetry-table-row v-for="(row, rowIndex) in visibleRows"
                        :key="rowIndex"
                        :headers="headers"
                        :columnWidths="columnWidths"
                        :rowIndex="rowIndex"
                        :rowOffset="rowOffset"
                        :rowHeight="rowHeight"
                        :row="row"
                        :marked="row.marked"
                        @mark="markRow"
                        @unmark="unmarkRow"
                        @markMultipleConcurrent="markMultipleConcurrentRows">
                    </telemetry-table-row>
                </tbody>
            </table>
        </div>
        <!-- Sizing table -->
        <table class="c-telemetry-table__sizing js-telemetry-table__sizing" :style="sizingTableWidth">
        <tr>
            <template v-for="(title, key) in headers">
            <th :key="key" :style="{ width: configuredColumnWidths[key] + 'px', 'max-width': configuredColumnWidths[key] + 'px'}">{{title}}</th>
            </template>
        </tr>
        <telemetry-table-row v-for="(sizingRowData, objectKeyString) in sizingRows"
            :headers="headers"
            :columnWidths="configuredColumnWidths"
            :row="sizingRowData">
        </telemetry-table-row>
    </table>
    </div>
</div><!-- closes c-table-wrapper -->
</template>

<style lang="scss">
    @import "~styles/sass-base";

    .c-telemetry-table__drop-target {
        position: absolute;
        width: 2px;
        background-color: $editUIColor;
        box-shadow: rgba($editUIColor, 0.5) 0 0 10px;
        z-index: 1;
        pointer-events: none;
    }

    .c-telemetry-table {
        // Table that displays telemetry in a scrolling body area
        display: flex;
        flex-flow: column nowrap;
        justify-content: flex-start;
        overflow: hidden;

        th, td {
            display: block;
            flex: 1 0 auto;
            width: 100px;
            vertical-align: middle; // This is crucial to hiding f**king 4px height injected by browser by default
        }

        td {
            color: $colorTelemFresh;
        }

        /******************************* WRAPPERS */
        &__headers-w {
            // Wraps __headers table
            flex: 0 0 auto;
            overflow: hidden;
            background: $colorTabHeaderBg;
        }

        /******************************* TABLES */
        &__headers,
        &__body {
            tr {
                display: flex;
                align-items: stretch;
            }
        }

        &__headers {
            // A table
            thead {
                display: block;
            }

            &__labels {
                // Top row, has labels
                .c-telemetry-table__headers__content {
                    // Holds __label, sort indicator and resize-hitarea
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 100%;
                }
            }
        }

        &__headers__label {
            overflow: hidden;
            flex: 0 1 auto;
        }

        &__resize-hitarea {
            // In table-column-header.vue
            @include abs();
            display: none; // Set to display: block in .is-editing section below
            left: auto; right: -1 * $tabularTdPadLR;
            width: $tableResizeColHitareaD;
            cursor: col-resize;
            transform: translateX(50%); // Move so this element sits over border between columns
        }

        /******************************* ELEMENTS */
        &__scroll-forcer {
            // Force horz scroll when needed; width set via JS
            font-size: 0;
            height: 1px; // Height 0 won't force scroll properly
            position: relative;
        }

        /******************************* WRAPPERS */
        &__body-w {
            // Wraps __body table provides scrolling
            flex: 1 1 100%;
            height: 0; // Fixes Chrome 73 overflow bug
            overflow-x: auto;
            overflow-y: scroll;
        }

        /******************************* TABLES */
        &__body {
            // A table
            flex: 1 1 100%;
            overflow-x: auto;

            tr {
                display: flex; // flex-flow defaults to row nowrap (which is what we want) so no need to define
                align-items: stretch;
                position: absolute;
                height: 18px; // Needed when a row has empty values in its cells

                &.is-selected {
                    background-color: $colorSelectedBg;
                }
            }

            td {
                overflow: hidden;
                text-overflow: ellipsis;
            }
        }

        &__sizing {
            // A table
            display: table;
            z-index: -1;
            visibility: hidden;
            pointer-events: none;
            position: absolute;

            //Add some padding to allow for decorations such as limits indicator
            tr {
                display: table-row;
            }

            th, td {
                display: table-cell;
                padding-right: 10px;
                padding-left: 10px;
                white-space: nowrap;
            }
        }
    }

    /******************************* EDITING */
    .is-editing {
        .c-telemetry-table__headers__labels {
            th[draggable],
            th[draggable] > * {
                cursor: move;
            }

            th[draggable]:hover {
                $b: $editFrameHovMovebarColorBg;
                background: $b;
                > * { background: $b; }
            }
        }

        .c-telemetry-table__resize-hitarea {
            display: block;
        }
    }

    .paused {
        border: 1px solid #ff9900;
    }

    /******************************* LEGACY */
    .s-status-taking-snapshot,
    .overlay.snapshot {
        // Handle overflow-y issues with tables and html2canvas
        // Replaces .l-sticky-headers .l-tabular-body { overflow: auto; }
        .c-table__body-w { overflow: auto; }
    }
</style>

<script>
import TelemetryTableRow from './table-row.vue';
import search from '../../../ui/components/search.vue';
import TableColumnHeader from './table-column-header.vue';
import _ from 'lodash';

const VISIBLE_ROW_COUNT = 100;
const ROW_HEIGHT = 17;
const RESIZE_POLL_INTERVAL = 200;
const AUTO_SCROLL_TRIGGER_HEIGHT = 100;
const RESIZE_HOT_ZONE = 10;
const MOVE_TRIGGER_WAIT = 500;
const VERTICAL_SCROLL_WIDTH = 30;

export default {
    components: {
        TelemetryTableRow,
        TableColumnHeader,
        search
    },
    inject: ['table', 'openmct', 'csvExporter'],
    props: {
        isEditing: {
            type: Boolean,
            default: false
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
            markedRows: []
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
            let sizingRowEl = this.sizingTable.children[0];
            let sizingCells = Array.from(sizingRowEl.children);
            let headerKeys = Object.keys(this.headers);

            headerKeys.forEach((headerKey, headerIndex)=>{
                let cell = sizingCells[headerIndex];
                let columnWidth = cell.offsetWidth;
                columnWidths[headerKey] = columnWidth;
                totalWidth += columnWidth;
            });

            this.columnWidths = columnWidths;
            this.totalWidth = totalWidth;

            this.calculateScrollbarWidth();
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
        scroll () {
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
        rowsAdded (rows) {
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
        rowsRemoved (rows) {
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
        pause(pausedByButton) {
            if (pausedByButton) {
                this.pausedByButton = true;
            }
            this.paused = true;
            this.table.pause();
        },
        unpause(unpausedByButton) {
            if (unpausedByButton) {
                this.paused = false;
                this.table.unpause();
                this.markedRows = [];
                this.pausedByButton = false;
            } else {
                if (!this.pausedByButton) {
                    this.paused = false;
                    this.table.unpause();
                    this.markedRows = [];
                }
            }
            
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
            this.undoMarkedRows();
            this.unpause();
        },
        markRow(rowIndex) {
            let insertMethod = 'unshift';

            if (this.markedRows.length && !this.ctrlKeyPressed) {
                this.undoMarkedRows();
                insertMethod = 'push';
            }

            let markedRow = this.visibleRows[rowIndex];

            this.$set(markedRow, 'marked', true);
            this.pause();

            this.markedRows[insertMethod](markedRow);
        },
        unmarkAllRows(skipUnpause) {
            this.markedRows.forEach(row => row.marked = false);
            this.markedRows = [];
            this.unpause();
        },
        markMultipleConcurrentRows(rowIndex) {

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
                    let temp = lastRowIndex;
                
                    lastRowIndex = firstRowIndex;
                    firstRowIndex = temp - 1;
                }

                for (var i = firstRowIndex + 1; i <= lastRowIndex; i++) {
                    let row = allRows[i];
                    row.marked = true;
                    this.markedRows.push(row);
                }

                this.$forceUpdate();
            }
        },
        keydown(event) {
            if ((event.ctrlKey || event.metaKey)) {
                this.ctrlKeyPressed = true;
            }
        },
        keyup(event) {
            if ((event.ctrlKey || event.key.toLowerCase() === 'meta')) {
                console.log('up');
                this.ctrlKeyPressed = false;
            }
        }
    },
    created() {
        this.filterChanged = _.debounce(this.filterChanged, 500);
    },
    mounted() {
        this.rowsAdded = _.throttle(this.rowsAdded, 200);
        this.rowsRemoved = _.throttle(this.rowsRemoved, 200);
        this.scroll = _.throttle(this.scroll, 100);

        this.table.on('object-added', this.addObject);
        this.table.on('object-removed', this.removeObject);
        this.table.on('outstanding-requests', this.outstandingRequests);

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

        document.addEventListener('keydown', this.keydown);
        document.addEventListener('keyup', this.keyup);
    },
    destroyed() {
        this.table.off('object-added', this.addObject);
        this.table.off('object-removed', this.removeObject);
        this.table.off('outstanding-requests', this.outstandingRequests);

        this.table.filteredRows.off('add', this.rowsAdded);
        this.table.filteredRows.off('remove', this.rowsRemoved);
        this.table.filteredRows.off('sort', this.updateVisibleRows);
        this.table.filteredRows.off('filter', this.updateVisibleRows);

        this.table.configuration.off('change', this.updateConfiguration);

        clearInterval(this.resizePollHandle);

        this.table.configuration.destroy();

        this.table.destroy();

        document.removeEventListener('keydown', this.keydown);
        document.removeEventListener('keyup', this.keyup);
    }
}
</script>
