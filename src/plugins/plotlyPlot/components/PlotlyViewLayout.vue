<template>
<div class="l-view-section js-plotly-container"></div>
</template>

<script>
import Plotly from 'plotly.js-dist';
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
            keyString: this.openmct.objects.makeKeyString(this.domainObject.identifier),
            timestampKey: this.openmct.time.timeSystem().key
        }
    },
    computed: {
        getContainerHeight: function () {
            return this.plotElement.parentNode.offsetHeight - 5;
        },
        getContainerWidth: function () {
            return this.plotElement.parentNode.offsetWidth - 5;
        },
        formattedTimestamp() {
            return this.formats[this.timestampKey].format(this.timestamp);
        }
    },
    mounted() {
        this.plotElement = document.querySelector('.js-plotly-container');

        this.createPlotDataCollections();

        this.openmct.time.on('timeSystem', this.changeClock);
        this.openmct.time.on('bounds', this.refreshData);

        this.timestampKey = this.openmct.time.timeSystem().key;

        this.initialize();
    },

    destroyed() {
        Object.keys(this.subscriptions)
            .forEach(subscription => this.unsubscribe(subscription));
        this.openmct.time.off('timeSystem', this.updateTimeSystem);
        this.openmct.time.off('bounds', this.updateBounds);
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
            this.metadata = this.openmct.telemetry.getMetadata(telemetryObject);
            this.formats = this.openmct.telemetry.getFormatMap(this.metadata);
            this.valueMetadata = this
                .metadata
                .valuesForHints(['range'])[0];
            this.valueKey = this.valueMetadata.key;

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
                xaxis: {
                    title: this.timestampKey.toUpperCase(),
                    zeroline: false,
                    showgrid: false,
                    range: [
                        this.formats[this.timestampKey].format(this.bounds.start),
                        this.formats[this.timestampKey].format(this.bounds.end)
                    ]
                },
                yaxis: {
                    title: this.valueMetadata.name,
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
                x.push(this.formats[this.timestampKey].format(datum));
                y.push(this.formats[this.valueKey].format(datum));
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
        updateData(datum, index) {
            // plot all datapoints within bounds
            if (datum.utc <= this.bounds.end) {

                Plotly.extendTraces(
                    this.plotElement,
                    {
                        x: [[this.formats[this.timestampKey].format(datum)]],
                        y: [[this.formats[this.valueKey].format(datum)]]
                    },
                    [index]
                );
                this.updatePlotRange();
            }
        },
        updatePlotRange() {
            let newRange = {
                'xaxis.range': [
                    this.formats[this.timestampKey].format(this.bounds.start),
                    this.formats[this.timestampKey].format(this.bounds.end)
                ]
            };
            Plotly.relayout(this.plotElement, newRange);
        },
        updateFilters() {
            this.filteredRows.clear();
            this.boundedRows.clear();
            Object.keys(this.subscriptions).forEach(this.unsubscribe, this);

            this.telemetryObjects.forEach(this.requestDataFor.bind(this));
            this.telemetryObjects.forEach(this.subscribeTo.bind(this));
        }
    }
}
</script>
