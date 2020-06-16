<template>
<div class="l-view-section js-plotly-container"></div>
</template>

<script>
import Plotly from 'plotly.js-dist';
import moment from 'moment';
import BoundedTableRowCollection from '../../telemetryTable/collections/BoundedTableRowCollection';
import FilteredTableRowCollection from '../../telemetryTable/collections/FilteredTableRowCollection';
import TelemetryTableRow from '../../telemetryTable/TelemetryTableRow';
import TelemetryTableColumn from '../../telemetryTable/TelemetryTableColumn';
import TelemetryTableConfiguration from '../../telemetryTable/TelemetryTableConfiguration';

export default {
    inject: ['openmct', 'domainObject'],
    data: function () {

        return {
            bounds: this.openmct.time.bounds(),
            timeRange: this.openmct.time.bounds().end - this.openmct.time.bounds().start,
            plotData: {},
            datumCache: [],
            outstandingRequests: 0,
            subscriptions: {},
            plotComposition: undefined,
            telemetryObjects: [],
            configuration: new TelemetryTableConfiguration(this.domainObject, this.openmct),
            keyString: this.openmct.objects.makeKeyString(this.domainObject.identifier)
        }
    },
    computed: {
        getContainerHeight: function () {
            return this.plotElement.parentNode.offsetHeight - 5;
        },
        getContainerWidth: function () {
            return this.plotElement.parentNode.offsetWidth - 5;
        }
    },
    mounted() {
        this.plotElement = document.querySelector('.js-plotly-container');

        this.createPlotDataCollections();

        this.openmct.time.on('bounds', this.refreshData);
        this.openmct.time.on('timeSystem', this.changeClock);

        this.initialize();
    },

    destroyed() {
        Object.keys(this.subscriptions)
            .forEach(subscription => this.unsubscribe(subscription));
    },
    methods: {
        initialize() {
            if (this.domainObject.type === 'plotlyPlot') {
                this.filterObserver = this.openmct.objects.observe(this.domainObject, 'configuration.filters', this.updateFilters);
                this.loadComposition();
            } else {
                this.addTelemetryObject(this.domainObject);
            }
        },
        createPlotDataCollections() {
            this.boundedRows = new BoundedTableRowCollection(this.openmct);
            this.filteredRows = new FilteredTableRowCollection(this.boundedRows);
        },
        loadComposition() {
            this.plotComposition = this.openmct.composition.get(this.domainObject);
            if (this.plotComposition !== undefined) {
                this.plotComposition.load().then((composition) => {

                    composition.forEach(this.addTelemetryObject);

                    this.plotComposition.on('add', this.addTelemetryObject);
                    this.plotComposition.on('remove', this.removeTelemetryObject);
                });
            }
        },
        addTelemetryObject(telemetryObject) {
            this.telemetryObjects.push(telemetryObject);
            this.addColumnsForObject(telemetryObject, true);
            this.requestDataFor(telemetryObject, true);
            this.subscribeTo(telemetryObject);
        },
        removeTelemetryObject(objectIdentifier) {
            const keyString = this.openmct.objects.makeKeyString(objectIdentifier);
            const index = this.telemetryObjects.findIndex(object => objectIdentifier.key === object.identifier.key);
            this.boundedRows.removeAllRowsForObject(keyString);
            this.unsubscribe(keyString);
            this.telemetryObjects = this.telemetryObjects.filter(object => !(objectIdentifier.key === object.identifier.key));
            if (!this.telemetryObjects.length) {
                Plotly.purge(this.plotElement);
            } else {
                Plotly.deleteTraces(this.plotElement, index);
            }
        },
        createColumn(metadatum) {
            return new TelemetryTableColumn(this.openmct, metadatum);
        },
        requestDataFor(telemetryObject, isAdd) {
            this.incrementOutstandingRequests();
            let requestOptions = this.buildOptionsFromConfiguration(telemetryObject);
            return this.openmct.telemetry.request(telemetryObject, requestOptions)
                .then(telemetryData => {
                    //Check that telemetry object has not been removed since telemetry was requested.
                    if (!this.telemetryObjects.includes(telemetryObject)) {
                        return;
                    }
                    const keyString = this.openmct.objects.makeKeyString(telemetryObject.identifier);
                    let columnMap = this.getColumnMapForObject(keyString);
                    let limitEvaluator = this.openmct.telemetry.limitEvaluator(telemetryObject);
                    this.processHistoricalData(telemetryData, columnMap, keyString, limitEvaluator, isAdd);
                }).finally(() => {
                    this.decrementOutstandingRequests();
                });
        },
        processHistoricalData(telemetryData, columnMap, keyString, limitEvaluator, isAdd) {
            let index = this.telemetryObjects.findIndex(object => keyString === object.identifier.key);
            this.addTrace(telemetryData, keyString, index, isAdd);

            let telemetryRows = telemetryData.map(datum => new TelemetryTableRow(datum, columnMap, keyString, limitEvaluator));
            this.boundedRows.add(telemetryRows);
        },
        getColumnMapForObject(objectKeyString) {
            let columns = this.configuration.getColumns();

            return columns[objectKeyString].reduce((map, column) => {
                map[column.getKey()] = column;
                return map;
            }, {});
        },
        addColumnsForObject(telemetryObject) {
            let metadataValues = this.openmct.telemetry.getMetadata(telemetryObject).values();

            metadataValues.forEach(metadatum => {
                let column = this.createColumn(metadatum);
                this.configuration.addSingleColumnForObject(telemetryObject, column);
            });
        },
        createColumn(metadatum) {
            return new TelemetryTableColumn(this.openmct, metadatum);
        },
        /**
         * @private
         */
        incrementOutstandingRequests() {
            if (this.outstandingRequests === 0) {
                this.$emit('outstanding-requests', true);
            }
            this.outstandingRequests++;
        },

        /**
         * @private
         */
        decrementOutstandingRequests() {
            this.outstandingRequests--;

            if (this.outstandingRequests === 0) {
                this.$emit('outstanding-requests', false);
            }
        },
        refreshData(bounds, isTick) {
            this.bounds = bounds;
            if ((!isTick && this.outstandingRequests === 0) || this.bounds.end - this.bounds.start) {
                this.boundedRows.clear();
                this.boundedRows.sortByTimeSystem(this.openmct.time.timeSystem());
                this.telemetryObjects.forEach(object => this.requestDataFor(object, false));
            }
        },
        clearData() {
            this.boundedRows.clear();
            // this.$emit('refresh');
        },
        subscribeTo(telemetryObject) {
            let subscribeOptions = this.buildOptionsFromConfiguration(telemetryObject);
            let keyString = this.openmct.objects.makeKeyString(telemetryObject.identifier);
            let columnMap = this.getColumnMapForObject(keyString);
            let limitEvaluator = this.openmct.telemetry.limitEvaluator(telemetryObject);
            const index = this.telemetryObjects.findIndex(object => keyString === object.identifier.key);
            this.subscriptions[keyString] = this.openmct.telemetry.subscribe(telemetryObject, (datum) => {
                //Check that telemetry object has not been removed since telemetry was requested.
                if (!this.telemetryObjects.includes(telemetryObject)) {
                    return;
                }
                let realtimeDatum = {
                    datum,
                    columnMap,
                    keyString,
                    limitEvaluator
                };
                this.datumCache.push(realtimeDatum);

                this.processRealtimeDatum(datum, columnMap, keyString, limitEvaluator, index);
            }, subscribeOptions);
        },

        processRealtimeDatum(datum, columnMap, keyString, limitEvaluator, index) {
            if (index > this.telemetryObjects.length -1) {
                return;
            }
            this.updateData(datum, index);
            this.boundedRows.add(new TelemetryTableRow(datum, columnMap, keyString, limitEvaluator));
        },
        processDatumCache() {
            this.datumCache.forEach(cachedDatum => {
                this.processRealtimeDatum(cachedDatum.datum, cachedDatum.columnMap, cachedDatum.keyString, cachedDatum.limitEvaluator);
            });
            this.datumCache = [];
        },
        isTelemetryObject(domainObject) {
            return domainObject.hasOwnProperty('telemetry');
        },
        buildOptionsFromConfiguration(telemetryObject) {
            let keyString = this.openmct.objects.makeKeyString(telemetryObject.identifier),
                filters = this.domainObject.configuration &&
                    this.domainObject.configuration.filters &&
                    this.domainObject.configuration.filters[keyString];

            return {filters} || {};
        },
        unsubscribe(keyString) {
            this.subscriptions[keyString]();
            delete this.subscriptions[keyString];
        },
        getLayout(keystring) {
            return {
                hovermode: 'compare',
                hoverdistance: -1,
                autosize: "true",
                showlegend: true,
                legend: {
                    y: 1.07,
                    "orientation": "h"
                },
                height: this.getContainerHeight,
                font: {
                    family: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                    size: "12px",
                    color: "#aaa"
                },
                xaxis: { // hardcoded as UTC for now
                    title: 'UTC',
                    zeroline: false,
                    showgrid: false,
                    range: [
                        this.formatDatumX({utc: this.bounds.start}),
                        this.formatDatumX({utc: this.bounds.end})
                    ]
                },
                yaxis: {
                    // title: this.getYAxisLabel(telemetryObject),
                    title: 'Sine',
                    zeroline: false,
                    showgrid: false,
                    tickwidth: 3,
                    tickcolor: 'transparent'
                },
                margin: {
                    l: 40,
                    r: 5,
                    b: 40,
                    t: 0
                },
                paper_bgcolor: 'transparent',
                plot_bgcolor: 'transparent'
            }
        },
        addTrace(telemetryData, keyString, index, isAdd) {
            let x = [];
            let y = [];

            telemetryData.forEach((datum) => {
                x.push(this.formatDatumX(datum));
                y.push(this.formatDatumY(datum));
            })

            let traceData = [{ // trace configuration
                x,
                y,
                name: this.telemetryObjects.filter(object => keyString === object.identifier.key)[0].name,
                type: 'scattergl',
                mode: 'lines+markers',
                marker: {
                    size: 5
                },
                line: {
                    shape: 'linear',
                    width: 1.5
                }
            }];

            this.boundedRows[keyString] = traceData[0];

            if (!this.plotElement.childNodes.length) { // no traces yet, so create new plot
                this.bounds = this.openmct.time.bounds();
                Plotly.newPlot(
                    this.plotElement,
                    traceData,
                    this.getLayout(keyString),
                    {
                        displayModeBar: false, // turns off hover-activated toolbar
                        staticPlot: true // turns off hover effects on datapoints
                    }
                );
            } else {
                if (isAdd) { // add a new trace to existing plot
                    Plotly.addTraces(this.plotElement, traceData);
                }
            }
        },
        getYAxisLabel(telemetryObject) {
            this.setYAxisProp(telemetryObject);
            const valueMetadatas = this.openmct.telemetry.getMetadata(telemetryObject).values();
            const index = valueMetadatas.findIndex(value => value.key === this.yAxisProp);
            const yLabel = valueMetadatas[index].name;

            return yLabel;
        },
        setYAxisProp(telemetryObject) {
            if (telemetryObject.type === 'generator') {
                this.yAxisProp = 'sin';
            } else if (telemetryObject.type === 'example.state-generator') {
                this.yAxisProp = 'state';
            } else if (telemetryObject.type === 'conditionSet') {
                this.yAxisProp = 'output';
            }
        },
        formatDatumX(datum) {
            let timestamp = moment.utc(datum.utc).format('YYYY-MM-DDTHH:mm:ss[Z]');
            return timestamp;
        },
        formatDatumY(datum) {
            return datum.sin;
        },
        updateData(datum, index) {
            // plot all datapoints within bounds
            if (datum.utc <= this.bounds.end) {

                Plotly.extendTraces(
                    this.plotElement,
                    {
                        x: [[this.formatDatumX(datum)]],
                        y: [[this.formatDatumY(datum)]]
                    },
                    [index]
                );
                this.updatePlotRange();
            }
        },
        updatePlotRange() {
            let newRange = {
                'xaxis.range': [
                    this.formatDatumX({utc: this.bounds.start}),
                    this.formatDatumX({utc: this.bounds.end})
                ]
            };
            Plotly.relayout(this.plotElement, newRange);
        }
    }
}
</script>
