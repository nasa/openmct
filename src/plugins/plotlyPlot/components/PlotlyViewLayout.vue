<template>
<div class="l-view-section"></div>
</template>

<script>
import Plotly from 'plotly.js/dist/plotly.min.js';
import moment from 'moment'

export default {
    inject: ['openmct', 'domainObject'],
    data: function () {

        return {
            telemetryObjects: [],
            bounds: {},
            timeRange:  0,
            plotData: {},
            subscriptions: {}
        }
    },
    mounted() {
        this.plotElement = document.querySelector('.l-view-section');

        this.composition = this.openmct.composition.get(this.domainObject);
        this.composition.on('add', this.addTelemetry);
        this.composition.on('remove', this.removeTelemetry);
        this.composition.load();

        this.openmct.time.on('bounds', this.refreshData);
        this.openmct.time.on('clock', this.changeClock);
    },
    destroyed() {
        Object.keys(this.subscriptions)
            .forEach(subscription => this.unsubscribe(subscription));
    },
    methods: {
        changeClock() {
            if (this.openmct.time.clock()) {
                //Plotly.purge(this.plotElement);
                this.telemetryObjects.forEach((telemetryObject, index) => {
                    this.subscribeTo(telemetryObject, index);
                });
            }
        },
        addTelemetry(telemetryObject) {
            this.telemetryObjects.push(telemetryObject);
            const index = this.telemetryObjects.length - 1;
            this.requestHistory(telemetryObject, index, true);
            this.subscribeTo(telemetryObject, index);
        },
        subscribeTo(telemetryObject, index) {
            let keyString = this.openmct.objects.makeKeyString(telemetryObject.identifier);
            this.subscriptions[keyString] = this.openmct.telemetry.subscribe(telemetryObject, (datum) => {
                //Check that telemetry object has not been removed since telemetry was requested.
                if (!this.telemetryObjects.includes(telemetryObject)) {
                    return;
                }
                this.updateData(datum, index);
            });
        },
        unsubscribe(keyString) {
            this.subscriptions[keyString]();
            delete this.subscriptions[keyString];
        },
        refreshData(bounds, isTick) {
            this.bounds = bounds;

            this.telemetryObjects.forEach((telemetryObject, index) => {
                if(!isTick) {
                    this.requestHistory(telemetryObject, index, false);
                } else {
                    if (this.timeRange === 0 || this.timeRange !== this.bounds.end - this.bounds.start) {
                        this.timeRange = this.bounds.end - this.bounds.start;

                        this.requestHistory(telemetryObject, index, false);
                    }
                }
            });
        },
        requestHistory(telemetryObject, index, isAdd) {
            this.openmct
                .telemetry
                .request(telemetryObject, {
                    start: this.bounds.start,
                    end: this.bounds.end
                })
                .then((telemetryData) => {
                    this.addTrace(telemetryData, telemetryObject, index, isAdd);
                });
        },
        getLayout(telemetryObject, isFixed) {
            return {
                hovermode: 'compare',
                hoverdistance: -1,
                autosize: "true",
                showlegend: true,
                legend: {
                    y: 1.1,
                    "orientation": "h"
                },
                font: {
                    family: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                    size: "12px",
                    color: "#666"
                },
                xaxis: { // hardcoded as UTC for now
                    title: 'UTC',
                    zeroline: false,
                    range: isFixed ? 'undefined' : [
                        this.formatDatumX({utc: this.bounds.start}),
                        this.formatDatumX({utc: this.bounds.start})
                    ]
                },
                yaxis: {
                    title: this.getYAxisLabel(telemetryObject),
                    zeroline: false
                },
                margin: {
                    l: 40,
                    r: 10,
                    b: 40,
                    t: 10
                },
                paper_bgcolor: 'transparent',
                plot_bgcolor: 'transparent'
            }
        },
        removeTelemetry(identifier) {
            let keyString = this.openmct.objects.makeKeyString(identifier);
            this.unsubscribe(keyString);
            this.telemetryObjects = this.telemetryObjects.filter(object => !(identifier.key === object.identifier.key));
            if (!this.telemetryObjects.length) {
                //Plotly.purge(this.plotElement);
            } else {
                //Plotly.deleteTraces(this.plotElement, this.telemetryObjects.length - 1);
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
        addTrace(telemetryData, telemetryObject, index, isAdd) {
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
                name: telemetryObject.name,
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

            this.plotData[telemetryObject.identifier.key] = traceData[0];

            if (!this.plotElement.childNodes.length) { // not traces yet, so create new plot
                // Plotly.newPlot(
                //     this.plotElement,
                //     traceData,
                //     this.getLayout(telemetryObject, true),
                //     {
                //         displayModeBar: false, // turns off hover-activated toolbar
                //         staticPlot: true // turns off hover effects on datapoints
                //     }
                // );
            } else {
                // if (isAdd) { // add a new trace to existing plot
                //     Plotly.addTraces(this.plotElement, traceData);
                // } else { // update existing trace with new data (bounds change)
                //     Plotly.react(this.plotElement, Object.values(this.plotData), this.getLayout(telemetryObject, false));
                //     this.updatePlotRange();
                // }
            }
        },
        updateData(datum, index) {
            // plot all datapoints within bounds
            if (datum.utc <= this.bounds.end) {

                // Plotly.extendTraces(
                //     this.plotElement,
                //     {
                //         x: [[this.formatDatumX(datum)]],
                //         y: [[this.formatDatumY(datum)]]
                //     },
                //     [index]
                // );
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
//            Plotly.relayout(this.plotElement, newRange);
        }
    }
}
</script>
