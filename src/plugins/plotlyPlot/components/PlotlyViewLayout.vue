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

        this.sortByTimeSystem = this.sortByTimeSystem.bind(this);
        this.bounds = this.bounds.bind(this);

        this.sortByTimeSystem(this.openmct.time.timeSystem());

        this.lastBounds = this.openmct.time.bounds();

        this.subscribeToBounds();

        this.openmct.time.on('bounds', this.refreshData);
        this.openmct.time.on('clock', this.refreshData);

    },
    methods: {
        refreshData() {
            if (!this.openmct.time.clock()) {
                this.unsubscribeToBounds();
            } else {
                this.subscribeToBounds();
            }
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
            const index = this.telemetryObjects.findIndex(obj => obj === telemetryObject);
            return this.openmct.telemetry.request(telemetryObject)
                .then(telemetryData => {
                    this.addTrace(telemetryData, telemetryObject, index);
                    if (this.openmct.time.clock()) {
                        this.subscribe(telemetryObject, index, telemetryData.length);
                    }
                });
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
                )
            } else {
                Plotly.addTraces(this.plotElement, traceData);
            }

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
        },
        bounds(bounds) {
            let startChanged = this.lastBounds.start !== bounds.start;
            let endChanged = this.lastBounds.end !== bounds.end;

            let startIndex = 0;
            let endIndex = 0;

            let discarded = [];
            let added = [];
            let testValue = {
                datum: {}
            };

            this.lastBounds = bounds;

            if (startChanged) {
                testValue.datum[this.sortOptions.key] = bounds.start;
                // Calculate the new index of the first item within the bounds
                startIndex = this.sortedIndex(this.rows, testValue);
                discarded = this.rows.splice(0, startIndex);
            }

            if (endChanged) {
                testValue.datum[this.sortOptions.key] = bounds.end;
                // Calculate the new index of the last item in bounds
                endIndex = this.sortedLastIndex(this.futureBuffer.rows, testValue);
                added = this.futureBuffer.rows.splice(0, endIndex);
                added.forEach((datum) => this.rows.push(datum));
            }

            if (discarded && discarded.length > 0) {
                /**
                 * A `discarded` event is emitted when telemetry data fall out of
                 * bounds due to a bounds change event
                 * @type {object[]} discarded the telemetry data
                 * discarded as a result of the bounds change
                 */
                this.emit('remove', discarded);
            }
            if (added && added.length > 0) {
                /**
                 * An `added` event is emitted when a bounds change results in
                 * received telemetry falling within the new bounds.
                 * @type {object[]} added the telemetry data that is now within bounds
                 */
                this.emit('add', added);
            }
        },
        unsubscribeFromBounds() {
            this.openmct.time.off('bounds', this.bounds);
        },
        subscribeToBounds() {
            this.openmct.time.on('bounds', this.bounds);
        }
    }
}
</script>
