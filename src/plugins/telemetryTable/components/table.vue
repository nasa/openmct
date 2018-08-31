<template>
<div class="tabular-holder l-sticky-headers has-control-bar l-telemetry-table" :class="{'loading': loading}">
    <div class="l-control-bar">
        <a class="s-button t-export icon-download labeled"
           v-on:click="exportAsCSV()"
           title="Export This View's Data">
            Export As CSV
        </a>
    </div>
    <!-- Headers table -->
    <div class="mct-table-headers-w">
        <table class="mct-table l-tabular-headers filterable" :style="{ 'max-width': totalWidth + 'px'}">
            <thead>
                <tr>
                    <th v-for="(title, key, headerIndex) in headers"
                        v-on:click="sortBy(key)"
                        :class="['sortable', sortOptions.key === key ? 'sort' : '', sortOptions.direction].join(' ')"
                        :style="{ width: columnWidths[headerIndex], 'max-width': columnWidths[headerIndex]}">{{title}}</th>
                </tr>
                <tr class="s-filters">
                    <th v-for="(title, key, headerIndex) in headers"
                        :style="{
                            width: columnWidths[headerIndex],
                            'max-width': columnWidths[headerIndex],
                        }">
                        <div class="holder l-filter flex-elem grows" :class="{active: filters[key]}">
                            <input type="text" v-model="filters[key]" v-on:input="filterChanged(key)" />
                            <a class="clear-icon clear-input icon-x-in-circle" :class="{show: filters[key]}" @click="clearFilter(key)"></a>
                        </div>
                    </th>
                    </tr>
            </thead>
        </table>
    </div>
    <!-- Content table -->
    <div @scroll="scroll" class="l-tabular-body t-scrolling vscroll--persist">
        <div class="mct-table-scroll-forcer"
            :style="{
                width: totalWidth
            }"></div>
        <table class="mct-table js-telemetry-table" :style="{ height: totalHeight + 'px', 'max-width': totalWidth + 'px'}">
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
    <table class="mct-sizing-table t-sizing-table js-sizing-table" :style="{width: calcTableWidth}">
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

<style>
</style>

<script>
import TelemetryTableRow from './table-row.vue';
import _ from 'lodash';

const VISIBLE_ROW_COUNT = 100;
const ROW_HEIGHT = 17;
const RESIZE_POLL_INTERVAL = 200;
const AUTO_SCROLL_TRIGGER_HEIGHT = 20;

export default {
    components: {
        TelemetryTableRow
    },
    inject: ['table', 'openmct', 'csvExporter'],
    props: ['configuration'],
    data() {
        return {
            headers: {},
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
            this.headersCount = Object.values(headers).length;
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
            const justTheData = this.table.filteredRows.getRows()
                .map(row => row.getFormattedDatum());
            const headers = Object.keys(this.headers);
            this.csvExporter.export(justTheData, {
                filename: this.table.domainObject.name + '.csv',
                headers: headers
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
        this.scrollable = this.$el.querySelector('.t-scrolling');
        this.sizingTable = this.$el.querySelector('.js-sizing-table');
        this.headersHolderEl = this.$el.querySelector('.mct-table-headers-w');

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
