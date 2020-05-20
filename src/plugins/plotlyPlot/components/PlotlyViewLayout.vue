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
        this.outstandingRequests = 0;

        this.openmct.time.on('bounds', this.updateBounds);
    },
    // destroyed() {
    //     this.unsubscribe();
    //     this.openmct.time.off('bounds', this.updateBounds);
    // },
    methods: {
        updateBounds(bounds, isTick) {
            this.bounds = bounds;
            if(!isTick && this.outstandingRequests === 0) {
                this.telemetryObjects.forEach((telemetryObject, index) => {
                    this.requestHistory(telemetryObject, index);
                });
            }
        },
        requestHistory(telemetryObject, index) {
            this.incrementOutstandingRequests();
            this.openmct
                .telemetry
                .request(telemetryObject, {
                    start: this.bounds.start,
                    end: this.bounds.end
                })
                .then((data) => this.addTrace(data, telemetryObject, index));
        },
        incrementOutstandingRequests() {
            if (this.outstandingRequests === 0) {
                this.$emit('outstanding-requests', true);
            }
            this.outstandingRequests++;
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

            let traceData = [{
                x,
                y,
                type: 'scattergl',
                mode: 'lines',
                line: {
                    color: colors[index],
                    shape: 'linear'
                }
            }];

            if (!this.plotElement.childNodes.length) {
                Plotly.newPlot(
                    this.plotElement,
                    traceData,
                    this.getLayout(telemetryObject),
                    {
                        displayModeBar: false,
                        staticPlot: true
                    }
                );
            } else {
                Plotly.addTraces(this.plotElement, traceData);
            }

            this.openmct.telemetry.subscribe(telemetryObject, (datum) => {
                this.updateData(datum, index, telemetryData.length);
            });

        },
        updateData(datum, index, length) {
            Plotly.extendTraces(
                this.plotElement,
                {
                    x: [[this.formatDatumX(datum)]],
                    y: [[this.formatDatumY(datum)]]
                },
                [index],
                length
            );
        }
    }
}
</script>
