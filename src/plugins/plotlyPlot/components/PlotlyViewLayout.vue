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
            points: 0,
            yAxisProp: ''
        }
    },
    mounted() {
        this.plotElement = document.querySelector('.l-view-section');

        this.composition = this.openmct.composition.get(this.domainObject);
        this.composition.on('add', this.addTelemetry);
        this.composition.on('remove', this.removeTelemetry);
        this.composition.load();
    },
    methods: {
        getLayout(telemetryObject) {
            this.getYAxisLabel(telemetryObject);
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
        addTelemetry(telemetryObject) {
            return this.openmct.telemetry.request(telemetryObject)
                .then(telemetryData => {
                    this.points = telemetryData.length;
                    this.createPlot(telemetryData, telemetryObject);
                }, () => {console.log(error)});
        },
        removeTelemetry(identifier) {
            const id = this.openmct.objects.makeKeyString(identifier);
            delete this.telemetryObjects[id];
        },
        formatDatumX(datum) {
            let timestamp = moment.utc(datum.utc).format('YYYY-MM-DDTHH:mm:ss[Z]');
            return timestamp;
        },
        formatDatumY(datum) {
            return datum[this.yAxisProp ? this.yAxisProp : 'value'];
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
                type: 'scattergl',
                mode: 'lines+markers',
                line: {
                    shape: 'linear'
                }
            }];

            Plotly.newPlot(
                this.plotElement,
                data,
                this.getLayout(telemetryObject),
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
                [0],
                this.points
            );
        }
    }
}
</script>
