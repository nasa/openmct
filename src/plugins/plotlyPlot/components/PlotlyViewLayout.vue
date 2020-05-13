<template>
<div class="l-view-section"></div>
</template>

<script>
import Plotly from 'plotly.js-dist';
import moment from 'moment'
import RemoveAction from '../../remove/RemoveAction';
import BoundedTableRowCollection from '../../telemetryTable/collections/BoundedTableRowCollection';

export default {
    inject: ['openmct', 'domainObject'],
    data: function () {

        return {
            telemetryObjects: []
        }
    },
    mounted() {
        this.plotElement = document.querySelector('.l-view-section');

        this.composition = this.openmct.composition.get(this.domainObject);
        this.composition.on('add', this.addTelemetry);
        this.composition.on('remove', this.removeTelemetry);
        this.composition.load();

        this.RemoveAction = new RemoveAction(this.openmct);
    },
    methods: {
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
                    // title: this.plotAxisTitle.xAxisTitle,
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
            const index = this.telemetryObjects.findIndex(obj => obj === telemetryObject);
            return this.openmct.telemetry.request(telemetryObject)
                .then(telemetryData => {
                    this.addTrace(telemetryData, telemetryObject, index);
                }, () => {console.log(error)});
        },
        removeTelemetry(identifier) {
            if (!this.domainObject.composition.length) {
                this.plotElement.remove()
            } else {
                Plotly.deleteTraces(this.plotElement, this.domainObject.composition.length);
            }
            return this.openmct.objects.get(identifier).then((childDomainObject) => {
                this.RemoveAction.removeFromComposition(this.domainObject, childDomainObject);
            });
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
                )
            } else {
                Plotly.addTraces(this.plotElement, traceData);
            }

            this.subscribe(telemetryObject, index, telemetryData.length);
        },
        subscribe(telemetryObject, index, length) {
            this.openmct.telemetry.subscribe(telemetryObject, (datum) => {
                this.updateData(datum, index, length)
            })
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
