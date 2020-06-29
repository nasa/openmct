<template>
<div class="l-view-section js-plotly-container"></div>
</template>

<script>
import _ from 'lodash';
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
            xRangeLength: 0
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
        this.openmct.time.on('timeSystem', this.refreshData);
        //this.openmct.time.on('bounds', this.refreshData);
        this.openmct.time.on('bounds', this.updateDomain);
        this.openmct.time.on('bounds', this.updateData);
        this.loadComposition();
        this.createPlot();

        this.boundedRows = {};
        this.limitEvaluators = {};
        this.columnMaps = {};
        this.traceIndices = [];
        this.drawBuffers = {};
    },

    destroyed() {
        Object.keys(this.subscriptions)
            .forEach(subscription => this.unsubscribe(subscription));
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
            // this.telemetryObjects.push(telemetryObject);
            // let index = this.telemetryObjects.length - 1;
            // this.addColumnsForObject(telemetryObject, index, true);

            // this.requestDataFor(telemetryObject, index, true);
            // this.subscribeTo(telemetryObject, index);
            this.addTraceForObject(telemetryObject);

            this.requestData(telemetryObject);
            this.subscribe(telemetryObject);
        },
        updateDomain(bounds, isTick) {
            let newDomain = {
                'xaxis.range': [
                    bounds.start,
                    bounds.end

                ]
            };
            Plotly.relayout(this.plotElement, newDomain);
        },
        updateData(bounds, isTick) {

        },
        requestData(telemetryObject) {
            return this.openmct.telemetry.request(telemetryObject)
                .then(telemetryData => {
                    const keyString = this.openmct.objects.makeKeyString(telemetryObject.identifier);
                    let columnMap = this.columnMaps[keyString];
                    let limitEvaluator = this.limitEvaluators[keyString];

                    const telemetryRows = telemetryData.map(datum => new TelemetryTableRow(datum, columnMap, keyString, limitEvaluator));
                    this.boundedRows[keyString].add(telemetryRows);
                });
        },
        subscribe(telemetryObject) {
            const keyString = this.openmct.objects.makeKeyString(telemetryObject.identifier);
            let columnMap = this.columnMaps[keyString];
            let limitEvaluator = this.limitEvaluators[keyString];

            return this.openmct.telemetry.subscribe(telemetryObject, (datum) => {
                let newRow = new TelemetryTableRow(datum, columnMap, keyString, limitEvaluator);
                this.boundedRows[keyString].add(newRow);
            })
        },
        createPlot() {
            let timeSystem = this.openmct.time.timeSystem();
            let bounds = this.openmct.time.bounds();
            let formatMetadata = {
                key: timeSystem.key,
                name: timeSystem.name,
                format: timeSystem.timeFormat
            }
            this.timeFormatter = this.openmct.telemetry.getValueFormatter(formatMetadata);
            let xRange = [
                bounds.start,
                bounds.end
            ];

            let layout = {
                hovermode: 'compare',
                hoverdistance: -1,
                autosize: true,
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
                    title: timeSystem.name,
                    type: 'date',
                    zeroline: false,
                    showgrid: false,
                    //tickformat: '%Y-%m-%dT%H:%M:%S.%LZ',
                    range: xRange
                },
                yaxis: {
                    zeroline: false,
                    showgrid: false,
                    tickwidth: 3,
                    tickcolor: 'transparent',
                    autorange: true
                },
                margin: {
                    l: 40,
                    r: 5,
                    b: 40,
                    t: 0
                },
                paper_bgcolor: 'transparent',
                plot_bgcolor: 'transparent'
            };
            Plotly.newPlot(
                this.plotElement,
                [],
                layout,
                {
                    displayModeBar: false, // turns off hover-activated toolbar
                    staticPlot: true // turns off hover effects on datapoints
                }
            );

        },
        addTraceForObject(telemetryObject) {
            let keyString = this.openmct.objects.makeKeyString(telemetryObject.identifier);
            let boundedRows = new BoundedTableRowCollection(this.openmct);
            this.boundedRows[keyString] = boundedRows;
            let index = this.traceIndices.length;
            this.traceIndices.push(keyString);
            Plotly.addTraces(this.plotElement, {type: "scattergl", x: [], y: []});

            const metadataValues = this.openmct.telemetry.getMetadata(telemetryObject).values();

            let columnMap = metadataValues.reduce((map, metadatum) => {
                let column = new TelemetryTableColumn(this.openmct, metadatum);
                map[metadatum.key] = column;
                return map;
            }, {});
            const limitEvaluator = this.openmct.telemetry.limitEvaluator(telemetryObject);
            const valueFormatter = this.openmct.telemetry.getValueFormatter(this.openmct.telemetry.getMetadata(telemetryObject).valuesForHints(['range'])[0]);

            this.columnMaps[keyString] = columnMap;
            this.limitEvaluators[keyString] = limitEvaluator;

            let timeSystemKey = this.openmct.time.timeSystem().key;
            let drawBuffer = {
                index,
                x: [],
                y: []
            };

            this.drawBuffers[keyString] = drawBuffer;

            boundedRows.on('add', (rows) => {
                if (rows instanceof Array) {
                    rows.forEach(row => {
                        drawBuffer.x.push(row.datum[timeSystemKey]);
                        drawBuffer.y.push(valueFormatter.format(row.datum));
                    })
                } else {
                    drawBuffer.x.push(rows.datum[timeSystemKey]);
                    drawBuffer.y.push(valueFormatter.format(rows.datum));
                }
                this.scheduleDraw();
            });

            // boundedRows.on('remove', () => {
            //     console.log("removed rows");
            // });
        },
        scheduleDraw() {
            if (!this.drawing) {
                this.drawing = true;
                requestAnimationFrame(() => {
                    let dataForXAxes = [];
                    let dataForYAxes = [];
                    let traceIndices = [];
                    Object.values(this.drawBuffers).forEach((drawBuffer) => {
                        dataForXAxes.push(drawBuffer.x);
                        dataForYAxes.push(drawBuffer.y);
                        traceIndices.push(drawBuffer.index);
                        drawBuffer.x = [];
                        drawBuffer.y = [];
                    });
                    Plotly.extendTraces(
                        this.plotElement,
                        {
                            x: dataForXAxes,
                            y: dataForYAxes
                        },
                        traceIndices
                    );

                    this.drawing = false;
                });
            }
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
        addTraces(telemetryData, keyString, index, extend) {
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
                if (extend) {
                    //Plotly.deleteTraces(this.plotElement, index);
                    this.updatePlotRange()
                }
                Plotly.addTraces(this.plotElement, traceData);
            }
        },
        setTraceData(telemetryObject, index, extend) {
            if (this.boundedRows[index]) {
                this.boundedRows[index].off('add', addRows);
                this.boundedRows[index].off('remove', removeRow);
            }
            this.boundedRows[index] = new BoundedTableRowCollection(this.openmct);
            this.metadataValues[index] = {};
            this.metadataValues[index].metadata = this.openmct.telemetry.getMetadata(telemetryObject);
            this.metadataValues[index].formats = this.openmct.telemetry.getFormatMap(this.metadataValues[index].metadata);
            this.metadataValues[index].valueMetadata = this.metadataValues[index].metadata.valuesForHints(['range'])[0];
            this.metadataValues[index].valueKey = this.metadataValues[index].valueMetadata.key;
            this.boundedRows[index].on('add', addRows);
            this.boundedRows[index].on('remove', removeRow);
            const parentScope = this;

            function addRows(rows) {
                if (rows.length) { // new trace (multiple rows)
                    let keyString = this.openmct.objects.makeKeyString(telemetryObject.identifier);
                    parentScope.addTraces(rows, keyString, index, extend);
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

            function removeRow(row) { // TODO: destroy here s
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
        subscribeTo(telemetryObject, index) {
            const subscribeOptions = this.buildOptionsFromConfiguration(telemetryObject);
            const keyString = this.openmct.objects.makeKeyString(telemetryObject.identifier);
            const columnMap = this.getColumnMapForObject(keyString);
            const limitEvaluator = this.openmct.telemetry.limitEvaluator(telemetryObject);
            this.subscriptions[keyString] = this.openmct.telemetry.subscribe(telemetryObject, (datum) => {
                this.processRealtimeDatum(datum, columnMap, keyString, limitEvaluator, index);
            }, subscribeOptions);
        },
        processHistoricalData(telemetryObject, telemetryData, index, columnMap, keyString, limitEvaluator) {
            this.setTraceData(telemetryObject, index, this.boundedRows[index] !== undefined);
            const telemetryRows = telemetryData.map(datum => new TelemetryTableRow(datum, columnMap, keyString, limitEvaluator));
            this.boundedRows[index].add(telemetryRows);
        },
        processRealtimeDatum(datum, columnMap, keyString, limitEvaluator, index) {
            if (index > this.telemetryObjects.length -1) {
                return;
            }
            this.boundedRows[index].add(new TelemetryTableRow(datum, columnMap, keyString, limitEvaluator));
        },
        refreshData(bounds, isTick) {
            this.bounds = bounds;

            if (!isTick && this.outstandingRequests === 0) {
                Plotly.purge(this.plotElement);
                this.telemetryObjects.forEach((object, index) => {
                    this.boundedRows[index].clear();
                    this.boundedRows[index].sortByTimeSystem(this.openmct.time.timeSystem());
                    this.requestDataFor(object, index);
                });
            }
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
        unsubscribe(keyString) {
            this.subscriptions[keyString]();
            delete this.subscriptions[keyString];
        },
        getLayout(keystring, index) {
            let metadataValues = this.metadataValues[index];
            return {
                hovermode: 'compare',
                hoverdistance: -1,
                autosize: true,
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
            Plotly.relayout(this.plotElement, newRange);
        },
    }
}
</script>
