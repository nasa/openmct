<template>
<div class="l-view-section js-plotly-container"></div>
</template>

<script>
import Plotly from 'plotly.js-gl2d-dist-min';
import BoundedTableRowCollection from '../../telemetryTable/collections/BoundedTableRowCollection';
import TelemetryTableRow from '../../telemetryTable/TelemetryTableRow';
import TelemetryTableColumn from '../../telemetryTable/TelemetryTableColumn';

export default {
    inject: ['openmct', 'domainObject'],
    data: function () {
        return {
            bounds: this.openmct.time.bounds(),
            plotData: {},
            outstandingRequests: 0,
            subscriptions: {},
            plotComposition: undefined,
            timestampKey: this.openmct.time.timeSystem().key,
            yAxisLabel: ''
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
        this.openmct.time.on('bounds', this.updateDomain);
        this.openmct.time.on('bounds', this.updateData);

        this.loadComposition();
        this.createPlot();

        this.boundedRows = {};
        this.limitEvaluators = {};
        this.columnMaps = {};
        this.drawBuffers = {};
        this.telemetryObjects = [];
        this.subscriptions = {};
        this.boundedRowsUnlisteners = {};
        this.traceIndices = {};
    },

    destroyed() {
        Object.values(this.subscriptions)
            .forEach(subscription => subscription());

        this.openmct.time.off('bounds', this.updateDomain);
        this.openmct.time.off('bounds', this.updateData);

        Object.values(this.boundedRowsUnlisteners).forEach((unlisteners) => {
            unlisteners.forEach(unlistener => unlistener());
        });

        this.plotComposition.off('add', this.addTelemetryObject);
        this.plotComposition.off('remove', this.removeTelemetryObject);
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
            let keyString = this.openmct.objects.makeKeyString(telemetryObject.identifier);
            this.addTraceForObject(telemetryObject);

            this.requestData(telemetryObject);
            let subscription = this.subscribe(telemetryObject);
            this.subscriptions[keyString] = subscription;
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
            if (!isTick) {
                this.clearData();
                this.telemetryObjects.forEach(telemetryObject => this.requestData(telemetryObject));
            }
        },
        clearData() {
            this.telemetryObjects.forEach(telemetryObject => this.resetTraceForObject(telemetryObject));
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
            });
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
        resetTraceForObject(telemetryObject) {
            this.removeTraceForObject(telemetryObject);
            this.addTraceForObject(telemetryObject);
        },
        removeTraceForObject(telemetryObject) {
            let keyString = this.openmct.objects.makeKeyString(telemetryObject.identifier);
            let index = this.traceIndices[keyString];
            Plotly.deleteTraces(this.plotElement, index);

            delete this.traceIndices[keyString];
            this.recalculateTraceIndices();

            this.boundedRowsUnlisteners[keyString].forEach((unlistener) => unlistener());
        },
        addTraceForObject(telemetryObject) {
            let keyString = this.openmct.objects.makeKeyString(telemetryObject.identifier);
            let boundedRows = new BoundedTableRowCollection(this.openmct);
            this.boundedRows[keyString] = boundedRows;

            this.traceIndices[keyString] = Object.keys(this.traceIndices).length;
            this.recalculateTraceIndices();

            Plotly.addTraces(this.plotElement, {
                x: [],
                y: [],
                name: telemetryObject.name,
                type: "scattergl",
                mode: 'lines+markers',
                marker: {
                    size: 5
                },
                line: {
                    shape: 'linear',
                    width: 1.5
                }
            });

            const metadataValues = this.openmct.telemetry.getMetadata(telemetryObject).values();

            let columnMap = metadataValues.reduce((map, metadatum) => {
                let column = new TelemetryTableColumn(this.openmct, metadatum);
                map[metadatum.key] = column;
                return map;
            }, {});
            const limitEvaluator = this.openmct.telemetry.limitEvaluator(telemetryObject);
            const valueFormatter = this.openmct.telemetry.getValueFormatter(this.openmct.telemetry.getMetadata(telemetryObject).valuesForHints(['range'])[0]);
            let layout_update = {
                yaxis: {title: valueFormatter.valueMetadata.name}
            };
            Plotly.update(this.plotElement, {}, layout_update)
            this.columnMaps[keyString] = columnMap;
            this.limitEvaluators[keyString] = limitEvaluator;

            let timeSystemKey = this.openmct.time.timeSystem().key;
            let drawBuffer = {
                keyString,
                x: [],
                y: []
            };

            this.drawBuffers[keyString] = drawBuffer;

            const addRow = (rows) => {
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
            }

            boundedRows.on('add', addRow);
            this.boundedRowsUnlisteners[keyString] = [];
            // boundedRows.on('remove', () => {
            //     console.log("removed rows");
            // });

            this.boundedRowsUnlisteners[keyString].push(() => {
                boundedRows.off('add', addRow);
            })
        },
        recalculateTraceIndices() {
            Object.keys(this.traceIndices).forEach((key, indexOfKey) => {
                this.traceIndices[key] = indexOfKey;
            });
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
                        traceIndices.push(this.traceIndices[drawBuffer.keyString]);
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
        }
    }
}
</script>
