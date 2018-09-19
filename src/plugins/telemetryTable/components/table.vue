<template>
<div class="c-table c-telemetry-table c-table--filterable c-table--sortable has-control-bar"
     :class="{'loading': loading}">
    <div class="c-table__control-bar c-control-bar">
        <a class="s-button t-export icon-download labeled"
           v-on:click="exportAsCSV()"
           title="Export This View's Data">
            Export As CSV
        </a>
    </div>
    <!-- Headers table -->
    <div class="c-table__headers-w js-table__headers-w">
        <table class="c-table__headers c-telemetry-table__headers"
               :style="{ 'max-width': totalWidth + 'px'}">
            <thead>
                <tr>
                    <th v-for="(title, key, headerIndex) in headers"
                        v-on:click="sortBy(key)"
                        :class="['is-sortable', sortOptions.key === key ? 'is-sorting' : '', sortOptions.direction].join(' ')"
                        :style="{ width: columnWidths[headerIndex], 'max-width': columnWidths[headerIndex]}">{{title}}</th>
                </tr>
                <tr>
                    <th v-for="(title, key, headerIndex) in headers"
                        :style="{
                            width: columnWidths[headerIndex],
                            'max-width': columnWidths[headerIndex],
                        }">
                        <search class="c-table__search"
                            v-model="filters[key]"
                            v-on:input="filterChanged(key)"
                            v-on:clear="clearFilter(key)" />
                    </th>
                </tr>
            </thead>
        </table>
    </div>
    <!-- Content table -->
    <div class="c-table__body-w c-telemetry-table__body-w js-telemetry-table__body-w" @scroll="scroll">
        <div class="c-telemetry-table__scroll-forcer" :style="{ width: totalWidth }"></div>
        <table class="c-table__body c-telemetry-table__body"
               :style="{ height: totalHeight + 'px', 'max-width': totalWidth + 'px'}">
            <tbody>
                <telemetry-table-row v-for="(row, rowIndex) in visibleRows"
                    :headers="headers"
                    :columnWidths="columnWidths"
                    :rowIndex="rowIndex"
                    :rowOffset="rowOffset"
                    :rowHeight="rowHeight"
                    :row="row"
                    >
                </telemetry-table-row>
            </tbody>
        </table>
    </div>
    <!-- Sizing table -->
    <table class="c-telemetry-table__sizing js-telemetry-table__sizing"
           :style="{width: calcTableWidth}">
        <tr>
            <th v-for="(title, key, headerIndex) in headers">{{title}}</th>
        </tr>
        <telemetry-table-row v-for="(sizingRowData, objectKeyString) in sizingRows"
            :headers="headers"
            :row="sizingRowData">
        </telemetry-table-row>
    </table>
</div>
</template>

<style lang="scss">
    @import "~styles/sass-base";

    .c-table {
        // Can be used by any type of table, scrolling, LAD, etc.
        $min-w: 50px;

        display: flex;
        flex-flow: column nowrap;
        justify-content: flex-start;
        overflow: hidden;
        position: absolute;
        top: 0; right: 0; bottom: 0; left: 0;

        &__control-bar,
        &__headers-w {
            // Don't allow top level elements to grow or shrink
            flex: 0 0 auto;
        }

        /******************************* ELEMENTS */
        th, td {
            display: block;
            flex: 1 0 auto;
            font-size: 0.7rem; // TEMP LEGACY TODO: refactor this when __main-container font-size is dealt with
            white-space: nowrap;
            min-width: $min-w;
            padding: $tabularTdPadTB $tabularTdPadLR;
            vertical-align: middle; // This is crucial to hiding f**king 4px height injected by browser by default
        }

        td {
            color: $colorTelemFresh;
            vertical-align: top;
        }

        &__control-bar {
            margin-bottom: $interiorMarginSm;
        }

        /******************************* WRAPPERS */
        &__headers-w {
            // Wraps __headers table
            background: $colorTabHeaderBg;
            overflow: hidden;
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

            th {
                &:not(:first-child) {
                    border-left: 1px solid $colorTabHeaderBorder;
                }
            }
        }

        &__body {
            // A table
            tr {
                &:not(:first-child) {
                    border-top: 1px solid $colorTabBorder;
                }
            }
        }

        /******************************* MODIFIERS */
        &--filterable {
            // TODO: discuss using the search.vue custom control here

            .l-filter {
                input[type="text"],
                input[type="search"] {
                    $p: 20px;
                    transition: padding 200ms ease-in-out;
                    box-sizing: border-box;
                    padding-right: $p; // Fend off from icon
                    padding-left: $p; // Fend off from icon
                    width: 100%;
                }
                &.active {
                    // When user has typed something, hide the icon and collapse left padding
                    &:before {
                        opacity: 0;
                    }
                    input[type="text"],
                    input[type="search"] {
                        padding-left: $interiorMargin;
                    }
                }
            }
        }

        &--sortable {
            .is-sorting {
                &:after {
                    color: $colorIconLink;
                    content: $glyph-icon-arrow-tall-up;
                    font-family: symbolsfont;
                    font-size: 8px;
                    display: inline-block;
                    margin-left: $interiorMarginSm;
                }
                &.desc:after {
                    content: $glyph-icon-arrow-tall-down;
                }
            }
            .is-sortable {
                cursor: pointer;
            }
        }
    }

    .c-telemetry-table {
        // Table that displays telemetry in a scrolling body area

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

    .c-table__control-bar {
        margin-bottom: $interiorMarginSm;
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
import search from '../../../ui/components/controls/search.vue';
import _ from 'lodash';

const VISIBLE_ROW_COUNT = 100;
const ROW_HEIGHT = 17;
const RESIZE_POLL_INTERVAL = 200;
const AUTO_SCROLL_TRIGGER_HEIGHT = 20;

export default {
    components: {
        TelemetryTableRow,
        search
    },
    inject: ['table', 'openmct', 'csvExporter'],
    props: ['configuration'],
    data() {
        return {
            headers: {},
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
            calcTableWidth: '100%',
            processingScroll: false,
            updatingView: false
        }
    },
    methods: {
        updateVisibleRows() {

            let start = 0;
            let end = VISIBLE_ROW_COUNT;
            let filteredRows = this.table.filteredRows.getRows();
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
        calculateFirstVisibleRow() {
            return Math.floor(this.scrollable.scrollTop / this.rowHeight);
        },
        calculateLastVisibleRow() {
            let bottomScroll = this.scrollable.scrollTop + this.scrollable.offsetHeight;
            return Math.floor(bottomScroll / this.rowHeight);
        },
        updateHeaders() {
            let headers = this.table.configuration.getVisibleHeaders();

            this.headers = headers;
            this.$nextTick().then(this.calculateColumnWidths);
        },
        setSizingTableWidth() {
            let scrollW = this.scrollable.offsetWidth - this.scrollable.clientWidth;

            if (scrollW && scrollW > 0) {
                this.calcTableWidth = 'calc(100% - ' + scrollW + 'px)';
            }
        },
        calculateColumnWidths() {
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
            this.table.filteredRows.sortBy(this.sortOptions);
        },
        scroll() {
            if (!this.processingScroll) {
                this.processingScroll = true;
                requestAnimationFrame(()=> {
                    this.updateVisibleRows();
                    this.synchronizeScrollX();

                    if (this.shouldSnapToBottom()) {
                        this.autoScroll = true;
                    } else {
                        // If user scrolls away from bottom, disable auto-scroll.
                        // Auto-scroll will be re-enabled if user scrolls to bottom again.
                        this.autoScroll = false;
                    }
                    this.processingScroll = false;
                });
            }
        },
        shouldSnapToBottom() {
            return this.scrollable.scrollTop >= (this.scrollable.scrollHeight - this.scrollable.offsetHeight - AUTO_SCROLL_TRIGGER_HEIGHT);
        },
        scrollToBottom() {
            this.scrollable.scrollTop = this.scrollable.scrollHeight;
        },
        synchronizeScrollX() {
            this.headersHolderEl.scrollLeft = this.scrollable.scrollLeft;
        },
        filterChanged(columnKey) {
            this.table.filteredRows.setColumnFilter(columnKey, this.filters[columnKey]);
        },
        clearFilter(columnKey) {
            this.filters[columnKey] = '';
            this.table.filteredRows.setColumnFilter(columnKey, '');
        },
        rowsAdded(rows) {
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

            if (!this.updatingView) {
                this.updatingView = true;
                requestAnimationFrame(()=> {
                    this.updateVisibleRows();
                    if (this.autoScroll) {
                        this.$nextTick().then(this.scrollToBottom);
                    }
                    this.updatingView = false;
                });
            }
        },
        rowsRemoved(rows) {
            if (!this.updatingView) {
                this.updatingView = true;
                requestAnimationFrame(()=> {
                    this.updateVisibleRows();
                    this.updatingView = false;
                });
            }
        },
        exportAsCSV() {
            const headerKeys = Object.keys(this.headers);
            const justTheData = this.table.filteredRows.getRows()
                .map(row => row.getFormattedDatum(this.headers));
            this.csvExporter.export(justTheData, {
                filename: this.table.domainObject.name + '.csv',
                headers: headerKeys
            });
        },
        outstandingRequests(loading) {
            this.loading = loading;
        },
        calculateTableSize() {
            this.setSizingTableWidth();
            this.$nextTick().then(this.calculateColumnWidths);
        },
        pollForResize() {
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
        updateConfiguration(configuration) {
            this.configuration = configuration;
            this.updateHeaders();
        },
        addObject() {
            this.updateHeaders();
        },
        removeObject(objectIdentifier) {
            let objectKeyString = this.openmct.objects.makeKeyString(objectIdentifier);
            delete this.sizingRows[objectKeyString];
            this.updateHeaders();
        }
    },
    created() {
        this.filterChanged = _.debounce(this.filterChanged, 500);
    },
    mounted() {
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
        this.sizingTable = this.$el.querySelector('.js-telemetry-table__sizing');
        this.headersHolderEl = this.$el.querySelector('.js-table__headers-w');

        this.table.configuration.on('change', this.updateConfiguration);

        this.calculateTableSize();
        this.pollForResize();

        this.table.initialize();
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
    }
}
</script>
