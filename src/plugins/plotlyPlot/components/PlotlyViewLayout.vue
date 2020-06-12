<template>
<div class="l-view-section js-plotly-container"></div>
</template>

<script>
import Plotly from 'plotly.js-dist';
import moment from 'moment';
import BoundedTableRowCollection from '../../telemetryTable/collections/BoundedTableRowCollection';

export default {
    inject: ['openmct', 'domainObject'],
    data: function () {

        return {
            telemetryObjects: [],
            bounds: this.openmct.time.bounds(),
            timeRange: this.openmct.time.bounds().end - this.openmct.time.bounds().start,
            plotData: {},
            subscriptions: {}
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

        this.plotComposition = undefined;
        this.telemetryObjects = [];
        this.datumCache = [];
        this.outstandingRequests = 0;
        this.keyString = this.openmct.objects.makeKeyString(this.domainObject.identifier);

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
                this.loadComposition();
            } else {
                this.addTelemetryObject(this.domainObject);
            }
        },
        createPlotDataCollections() {
            this.boundedData = new BoundedTableRowCollection(this.openmct);
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
            this.requestDataFor(telemetryObject);
            this.subscribeTo(telemetryObject);
            this.telemetryObjects.push(telemetryObject);

            this.$emit('object-added', telemetryObject);

        },
        removeTelemetryObject(objectIdentifier) {
            let keyString = this.openmct.objects.makeKeyString(objectIdentifier);
            this.boundedData.removeAllRowsForObject(keyString);

            this.unsubscribe(keyString);

            this.telemetryObjects = this.telemetryObjects.filter(object => !(objectIdentifier.key === object.identifier.key));
            if (!this.telemetryObjects.length) {
                Plotly.purge(this.plotElement);
            } else {
                Plotly.deleteTraces(this.plotElement, this.telemetryObjects.length - 1);
            }

            this.$emit('object-removed', objectIdentifier);
        },
        requestDataFor(telemetryObject, isAdd) {
            this.incrementOutstandingRequests();
            return this.openmct.telemetry.request(telemetryObject)
                .then(telemetryData => {
                    //Check that telemetry object has not been removed since telemetry was requested.
                    if (!this.telemetryObjects.includes(telemetryObject)) {
                        return;
                    }
                    let keyString = this.openmct.objects.makeKeyString(telemetryObject.identifier);
                    this.processHistoricalData(telemetryData, keyString, true);
                }).finally(() => {
                    this.decrementOutstandingRequests();
                });
        },
        processHistoricalData(telemetryData, keyString, isAdd) {
            console.log('processHistoricalData', isAdd);
            const index = this.telemetryObjects.length - 1;
            this.addTrace(telemetryData, keyString, index, isAdd);

            //let telemetryRows = telemetryData.map(datum => new TelemetryTableRow(datum, columnMap, keyString, limitEvaluator));
            //this.boundedData.add(telemetryRows);
            this.$emit('historical-rows-processed');
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
                this.boundedData.clear();
                this.boundedData.sortByTimeSystem(this.openmct.time.timeSystem());
                this.telemetryObjects.forEach(this.requestDataFor);
            }
        },
        clearData() {
            this.boundedData.clear();
            this.$emit('refresh');
        },
        subscribeTo(telemetryObject) {
            let keyString = this.openmct.objects.makeKeyString(telemetryObject.identifier);

            this.subscriptions[keyString] = this.openmct.telemetry.subscribe(telemetryObject, (datum) => {
                //Check that telemetry object has not been removed since telemetry was requested.
                if (!this.telemetryObjects.includes(telemetryObject)) {
                    return;
                }
                this.processRealtimeDatum(datum, this.telemetryObjects.length - 1);
            });
        },

        processRealtimeDatum(datum, index) {
            this.updateData(datum, index);
            // this.boundedData.add(new TelemetryTableRow(datum, columnMap, keyString, limitEvaluator));
        },

        isTelemetryObject(domainObject) {
            return domainObject.hasOwnProperty('telemetry');
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
                    color: "#666"
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

            // temp palette for demo
            const colors = ['rgb(32, 178, 170)', 'rgb(154, 205, 50)', 'rgb(255, 140, 0)'];

            telemetryData.forEach((datum) => {
                x.push(this.formatDatumX(datum));
                y.push(this.formatDatumY(datum));
            })

            let traceData = [{ // trace configuration
                x,
                y,
                // name: telemetryObject.name,
                name: 'test',
                type: 'scattergl',
                mode: 'lines+markers',
                marker: {
                    size: 5
                },
                line: {
                    color: colors[index], // to set new color for each trace
                    shape: 'linear',
                    width: 1.5
                }
            }];

            this.boundedData[keyString] = traceData[0];

            if (!this.plotElement.childNodes.length) { // no traces yet, so create new plot
                this.bounds = this.openmct.time.bounds();
                Plotly.newPlot(
                    this.plotElement,
                    traceData,
                    this.getLayout(keyString),
                    {
                        displayModeBar: true, // turns off hover-activated toolbar
                        staticPlot: false // turns off hover effects on datapoints
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
