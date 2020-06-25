<template>
<div class="l-view-section js-plotly-container"></div>
</template>

<script>
import Plotly from 'plotly.js-dist';
import BoundedTableRowCollection from '../../telemetryTable/collections/BoundedTableRowCollection';
import TelemetryTableRow from '../../telemetryTable/TelemetryTableRow';
import TelemetryTableColumn from '../../telemetryTable/TelemetryTableColumn';
import TelemetryTableConfiguration from '../../telemetryTable/TelemetryTableConfiguration';

export default {
    inject: ['openmct', 'domainObject'],
    data: function () {

        return {
            bounds: this.openmct.time.bounds(),
            plotData: {},
            outstandingRequests: 0,
            subscriptions: {},
            plotComposition: undefined,
            telemetryObjects: [],
            configuration: new TelemetryTableConfiguration(this.domainObject, this.openmct),
            keyString: this.openmct.objects.makeKeyString(this.domainObject.identifier),
            timestampKey: this.openmct.time.timeSystem().key,
            metadataValues: [],
            boundedRows: [],
            xRangeLength: 0,
            hasListeners: false
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
        // this.openmct.time.on('clock', this.setViewFromClock);
        this.openmct.time.on('timeSystem', this.refreshData);
        this.openmct.time.on('bounds', this.refreshData);
        this.loadComposition();
    },

    destroyed() {
        Object.keys(this.subscriptions)
            .forEach(subscription => this.unsubscribe(subscription));
        // this.boundedRows.forEach((row, index) => {
        //     this.boundedRows[index].off('add', addRows);
        //     this.boundedRows[index].off('remove', removeRow);

        // })
        this.openmct.time.off('timeSystem', this.refreshData);
        this.openmct.time.off('bounds', this.refreshData);
    },
    methods: {
        loadComposition() {
            this.plotComposition = this.openmct.composition.get(this.domainObject);
            this.plotComposition.on('add', this.addTelemetryObject);
            this.plotComposition.on('remove', this.removeTelemetryObject);
            this.plotComposition.load()
        },
        addTelemetryObject(telemetryObject) {
            this.telemetryObjects.push(telemetryObject);
            let index = this.telemetryObjects.length - 1;
            this.addColumnsForObject(telemetryObject, index, true);
            this.requestDataFor(telemetryObject, index, true);
            this.subscribeTo(telemetryObject, index);
        },
        removeTelemetryObject(objectIdentifier) {
            const keyString = this.openmct.objects.makeKeyString(objectIdentifier);
            const index = this.telemetryObjects.findIndex(object => objectIdentifier.key === object.identifier.key);
            this.configuration.removeColumnsForObject(objectIdentifier, true);
            this.boundedRows[index].clear();
            this.unsubscribe(keyString);
            this.telemetryObjects = this.telemetryObjects.filter(object => !(objectIdentifier.key === object.identifier.key));

            if (!this.telemetryObjects.length) {
                Plotly.purge(this.plotElement);
            }
        },
        addTraces(telemetryData, keyString, index) {
            console.log('index', index);
            let x = [];
            let y = [];
            let metadataValues = this.metadataValues[index];

            telemetryData.forEach(row => {
                x.push(metadataValues.formats[this.timestampKey].format(row.datum));
                y.push(metadataValues.formats[metadataValues.valueKey].format(row.datum));
            });

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

            this.boundedRows[index][keyString] = traceData[0];

            if (!this.plotElement.childNodes.length) { // no traces yet, so create new plot
                this.bounds = this.openmct.time.bounds();
                Plotly.newPlot(
                    this.plotElement,
                    traceData,
                    this.getLayout(keyString, index),
                    {
                        displayModeBar: false, // turns off hover-activated toolbar
                        staticPlot: true // turns off hover effects on datapoints
                    }
                );
            } else {
                Plotly.addTraces(this.plotElement, traceData);
            }
        },
        setTraceData(telemetryObject, index) {
            if (this.boundedRows[index]) {
                return;
            }
            this.boundedRows[index] = new BoundedTableRowCollection(this.openmct);
            this.metadataValues[index] = {};
            this.metadataValues[index].metadata = this.openmct.telemetry.getMetadata(telemetryObject);
            this.metadataValues[index].formats = this.openmct.telemetry.getFormatMap(this.metadataValues[index].metadata);
            this.metadataValues[index].valueMetadata = this.metadataValues[index].metadata.valuesForHints(['range'])[0];
            this.metadataValues[index].valueKey = this.metadataValues[index].valueMetadata.key;
            if (!this.hasListeners) {
                this.boundedRows[index].on('add', addRows);
                this.boundedRows[index].on('remove', removeRow);
                this.hasListeners = true;
            }
            const parentScope = this;

            function addRows(rows) {
                console.log('rows.length', rows.length);
                let isFixed = this.openmct.time.clock() === undefined;
                if (rows.length) { // new trace (multiple rows)
                    let keyString = parentScope.openmct.objects.makeKeyString(telemetryObject.identifier);
                    parentScope.addTraces(rows, keyString, index);
                } else { //extending existing trace row by row
                    let datum = rows.datum !== undefined ? rows.datum : rows[0].datum
                    let metadataValues = parentScope.metadataValues[index];
                    parentScope.updatePlotRange(index);
                    Plotly.extendTraces(
                        parentScope.plotElement,
                        {
                            x: [[metadataValues.formats[parentScope.timestampKey].format(datum)]],
                            y: [[metadataValues.formats[metadataValues.valueKey].format(datum)]]
                        },
                        [index]
                    );
                }
            }

            function removeRow(row) { // TODO: destroy here
                // parentScope.updatePlotRange(index);
                // Plotly.update(this.plotElement, )
            }
        },
        requestDataFor(telemetryObject, index) {
            this.outstandingRequests++;
            const requestOptions = this.buildOptionsFromConfiguration(telemetryObject);
            return this.openmct.telemetry.request(telemetryObject, requestOptions)
                .then(telemetryData => {
                    //Check that telemetry object has not been removed since telemetry was requested.
                    if (!this.telemetryObjects.includes(telemetryObject)) {
                        return;
                    }
                    const keyString = this.openmct.objects.makeKeyString(telemetryObject.identifier);
                    const columnMap = this.getColumnMapForObject(keyString);
                    const limitEvaluator = this.openmct.telemetry.limitEvaluator(telemetryObject);
                    this.processHistoricalData(telemetryObject, telemetryData, index, columnMap, keyString, limitEvaluator);
                }).finally(() => {
                    this.outstandingRequests--;
                });
        },
        refreshData(bounds, isTick) {
            this.bounds = bounds;
            if (!isTick && this.outstandingRequests === 0) {
                Plotly.purge(this.plotElement);
                this.telemetryObjects.forEach((object, index) => {
                    this.boundedRows[index].clear();
                    this.requestDataFor(object, index);
                });
            }
        },
        setViewFromClock(clock) {
            if (clock === undefined) {
                return;
            }
            // Plotly.purge(this.plotElement);
            // this.telemetryObjects.forEach((object, index) => {
            //     this.boundedRows[index].clear();
            //     this.requestDataFor(object, index);
            // });
        },
        subscribeTo(telemetryObject, index) {
            const subscribeOptions = this.buildOptionsFromConfiguration(telemetryObject);
            const keyString = this.openmct.objects.makeKeyString(telemetryObject.identifier);
            const columnMap = this.getColumnMapForObject(keyString);
            const limitEvaluator = this.openmct.telemetry.limitEvaluator(telemetryObject);
            this.subscriptions[keyString] = this.openmct.telemetry.subscribe(telemetryObject, (datum) => {
                this.processRealtimeDatum(telemetryObject, datum, columnMap, keyString, limitEvaluator, index);
            }, subscribeOptions);
        },
        processHistoricalData(telemetryObject, telemetryData, index, columnMap, keyString, limitEvaluator) {
            this.setTraceData(telemetryObject, index, this.boundedRows[index] !== undefined);
            const telemetryRows = telemetryData.map(datum => new TelemetryTableRow(datum, columnMap, keyString, limitEvaluator));
            this.boundedRows[index].add(telemetryRows);
        },
        processRealtimeDatum(telemetryObject, datum, columnMap, keyString, limitEvaluator, index) {
            if (index > this.telemetryObjects.length -1) {
                return;
            }
            this.setTraceData(telemetryObject, index);
            this.boundedRows[index].add(new TelemetryTableRow(datum, columnMap, keyString, limitEvaluator));
        },
        unsubscribe(keyString) {
            this.subscriptions[keyString]();
            delete this.subscriptions[keyString];
        },
        getColumnMapForObject(objectKeyString) {
            const columns = this.configuration.getColumns();

            return columns[objectKeyString].reduce((map, column) => {
                map[column.getKey()] = column;
                return map;
            }, {});
        },
        addColumnsForObject(telemetryObject, index) {
            const metadataValues = this.openmct.telemetry.getMetadata(telemetryObject).values();

            metadataValues.forEach(metadatum => {
                let column = new TelemetryTableColumn(this.openmct, metadatum);
                this.configuration.addSingleColumnForObject(telemetryObject, column);
            });
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
        getLayout(keystring, index) {
            let metadataValues = this.metadataValues[index];
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
                        metadataValues.formats[this.timestampKey].format(this.bounds.start),
                        metadataValues.formats[this.timestampKey].format(this.bounds.end)
                    ]
                },
                yaxis: {
                    title: metadataValues.valueMetadata.name,
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
        updatePlotRange() {
            let metadataValues = this.metadataValues[0];
            let newRange = {
                'xaxis.range': [
                    metadataValues.formats[this.timestampKey].format(this.bounds.start),
                    metadataValues.formats[this.timestampKey].format(this.bounds.end)
                ]
            };
            // console.log('newRange', newRange);
            Plotly.relayout(this.plotElement, newRange);
        }
    }
}
</script>
