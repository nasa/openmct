<template>
<div class="l-view-section"></div>
</template>

<script>
import Plotly from 'plotly.js-dist';
import moment from 'moment'

export default {
    inject: ['openmct', 'domainObject', 'objectPath'],
    data: function () {

        return {
            telemetryObjects: []
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
            return this.openmct.telemetry.request(telemetryObject)
                .then(telemetryData => {
                    this.createPlot(telemetryData, telemetryObject);
                }, () => {console.log(error)});
        },
        formatDatumX(datum) {
            let timestamp = moment.utc(datum.utc).format('YYYY-MM-DDTHH:mm:ss[Z]');
            return timestamp;
        },
        formatDatumY(datum) {
            return datum.sin;
        },
        createPlot(telemetryData, telemetryObject) {
            let x = [],
                y = [];

            telemetryData.forEach((datum, index) => {
                x.push(this.formatDatumX(datum));
                y.push(this.formatDatumY(datum));
            })

            let data = [{
                x,
                y,
                mode: 'line'
            }];

            Plotly.newPlot(
                this.plotElement,
                data,
                this.getLayout(),
                { displayModeBar: false }
            )

            this.subscribe(telemetryObject);
        },
        subscribe(domainObject) {
            this.openmct.telemetry.subscribe(domainObject, (datum) => {
                this.updateData(datum)
            })
        },
        updateData(datum) {
            Plotly.extendTraces(
                this.plotElement,
                {
                    x: [[this.formatDatumX(datum)]],
                    y: [[this.formatDatumY(datum)]]
                },
                [0]
            );
        }
    }
}
</script>
