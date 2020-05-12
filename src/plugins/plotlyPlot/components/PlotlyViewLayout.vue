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
            points: 0
        }
    },
    mounted() {
        this.plotElement = document.querySelector('.l-view-section');

        this.composition = this.openmct.composition.get(this.domainObject);
        this.composition.on('add', this.addTelemetry);
        this.composition.load();


    },
    methods: {
        getLayout() {
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
                    // title: this.plotAxisTitle.xAxisTitle,
                    title: 'UTC',
                    zeroline: false
                },
                yaxis: {
                    // title: this.plotAxisTitle.yAxisTitle,
                    title: 'Sine',
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
            const index = this.telemetryObjects.findIndex(obj => obj === telemetryObject);
            return this.openmct.telemetry.request(telemetryObject)
                .then(telemetryData => {
                    this.points = telemetryData.length;
                    this.addTrace(telemetryData, telemetryObject, index);
                }, () => {console.log(error)});
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
                    { displayModeBar: false }
                )
            } else {
                Plotly.addTraces(this.plotElement, traceData);
            }

            this.subscribe(telemetryObject);
        },
        subscribe(telemetryObject) {
            this.openmct.telemetry.subscribe(telemetryObject, (datum) => {
                this.updateData(datum)
            })
        },
        updateData(datum) {
            Plotly.extendTraces(
                this.plotElement,
                {
                    x: [[this.formatDatumX(datum)], [this.formatDatumX(datum)]],
                    y: [[this.formatDatumY(datum)], [this.formatDatumY(datum)]]
                },
                [0, 1],
                this.points
            );
        }
    }
}
</script>
