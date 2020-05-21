<template>
<div class="l-view-section"></div>
</template>

<script>
import Plotly from 'plotly.js-dist';
import moment from 'moment'

export default {
    inject: ['openmct', 'domainObject'],
    data: function () {

        return {
            telemetryObjects: [],
            lastBounds: this.openmct.time.bounds()
        }
    },
    mounted() {
        this.plotElement = document.querySelector('.l-view-section');

        this.composition = this.openmct.composition.get(this.domainObject);
        this.composition.on('add', this.addTelemetry);
        this.composition.on('remove', this.removeTelemetry);
        this.composition.load();

        this.bounds = this.openmct.time.bounds();

        this.openmct.time.on('clock', this.refreshData);
        this.openmct.time.on('bounds', this.refreshData);
    },
    // destroyed() {
    //     this.unsubscribe();
    //     this.openmct.time.off('bounds', this.updateBounds);
    // },
    methods: {
        refreshData(bounds, isTick) {
            this.bounds = bounds;
            if(!isTick) { // if fixed timespan get new data on bounds change
                console.log('refreshData - fixed');
                this.telemetryObjects.forEach((telemetryObject, index) => {
                    this.requestHistory(telemetryObject, index);
                });
            } else {
                console.log('refreshData - clock');
            }
        },
        requestHistory(telemetryObject, index) {
            this.openmct
                .telemetry
                .request(telemetryObject)
                .then((telemetryData) => this.addTrace(telemetryData, telemetryObject, index));
        },
        getLayout(telemetryObject) {
            return {
                hovermode: 'compare',
                hoverdistance: -1,
                autosize: "true",
                showlegend: false,
                font: {
                    family: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                    size: "12px",
                    color: "#666"
                },
                xaxis: {
                    // make this dynamic
                    title: 'UTC',
                    zeroline: false
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
        addTelemetry(telemetryObject) {
            this.telemetryObjects.push(telemetryObject);
            // get index by length
            const index = this.telemetryObjects.findIndex(obj => obj === telemetryObject);
            return this.requestHistory(telemetryObject, index);
        },
        removeTelemetry(identifier) {
            if (!this.domainObject.composition.length) {
                this.plotElement.remove()
            } else {
                Plotly.deleteTraces(this.plotElement, this.domainObject.composition.length);
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
        addTrace(telemetryData, telemetryObject, index) {
            let x = [];
            let y = [];

            const colors = ['red', 'green', 'blue'];

            telemetryData.forEach((datum) => {
                x.push(this.formatDatumX(datum));
                y.push(this.formatDatumY(datum));
            })

            let traceData = [{ // trace configuration
                x,
                y,
                type: 'scattergl',
                mode: 'lines',
                line: {
                    color: colors[index], // to set new color for each trace
                    shape: 'linear'
                }
            }];

            if (!this.plotElement.childNodes.length) { // not traces yet, so create new plot
                Plotly.newPlot(
                    this.plotElement,
                    traceData,
                    this.getLayout(telemetryObject),
                    {
                        displayModeBar: false, // turns off hover-activated toolbar
                        staticPlot: true // turns off hover effects on datapoints
                    }
                );
            } else { // add a new trace to existing plot
                Plotly.addTraces(this.plotElement, traceData);
            }

            // subscribe to new telemetry points for the trace
            this.openmct.telemetry.subscribe(telemetryObject, (datum) => {
                this.updateData(datum, index, telemetryData.length);
            });

        },
        updateData(datum, index, length) {
            // plot all datapoints within bounds
            if (datum.utc <= this.openmct.time.bounds().end && this.openmct.time.clock()) {
                Plotly.extendTraces(
                    this.plotElement,
                    {
                        x: [[this.formatDatumX(datum)]],
                        y: [[this.formatDatumY(datum)]]
                    },
                    [index], // apply changes to particular trace
                    length // set the fixed number of points (will drop points from beginning as new points are added)
                );
            }
        }
    }
}
</script>
