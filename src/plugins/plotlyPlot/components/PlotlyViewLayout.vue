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
            // currentDomainObject: this.domainObject
        }
    },
    mounted() {
        this.composition = this.openmct.composition.get(this.domainObject);
        this.composition.on('add', this.addTelemetry);
        this.composition.load();

        this.metadata = this.openmct.telemetry.getMetadata(this.domainObject);

        console.log('this.metadata', this.metadata);

        // this.keystring = this.openmct.objects.makeKeyString(this.domainObject.identifier);
        // this.subscribe(this.domainObject);
        this.plotElement = document.querySelector('.l-view-section');
        // Plotly.newPlot(this.plotElement, [{
        //     x: [1, 2, 3, 4, 5],
        //     y: [1, 2, 4, 8, 16]
        // }], this.getLayout(), {displayModeBar: false});

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
                    zeroline: false
                },
                yaxis: {
                    // title: this.plotAxisTitle.yAxisTitle,
                    zeroline: false
                },
                margin: {
                    l: 20,
                    r: 10,
                    b: 20,
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
            let timestamp = moment.utc(datum.utc).format('YYYY-MM-DD hh:mm:ss.ms');
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
            var layout = {
                title:'Line and Scatter Plot'
            };
            Plotly.newPlot(
                this.plotElement,
                data,
                this.getLayout()
            )

            this.subscribe(telemetryObject);
        },
        subscribe(domainObject) {
            // this.date = ''
            // this.openmct.objects.get(this.keystring)
            //     .then((object) => {
            //         const metadata = this.openmct.telemetry.getMetadata(this.domainObject);
            //         console.log('metadata', metadata);
            //         // this.timeKey = this.openmct.time.timeSystem().key;
            //         // this.timeFormat = this.openmct.telemetry.getValueFormatter(metadata.value(this.timeKey));
            //         // // this.imageFormat = this.openmct.telemetry.getValueFormatter(metadata.valuesForHints(['image'])[0]);
            //         // this.unsubscribe = this.openmct.telemetry
            //         //     .subscribe(this.domainObject, (datum) => {
            //         //         this.updateHistory(datum);
            //         //         this.updateValues(datum);
            //         //     });

            //         // this.requestHistory(this.openmct.time.bounds());
            //     });

            this.openmct.telemetry.subscribe(domainObject, (datum) => {
                this.updateData(datum)
            })
        },
        updateData(datum) {
            // Plotly.extendTraces(
            //     this.plotElement,
            //     {
            //         x: [this.formatDatumX(datum)],
            //         y: [this.formatDatumY(datum)]
            //     },
            //     [0]
            // );
            console.log(datum);
        }
    }
}
</script>
