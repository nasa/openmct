<template>
<div class="l-view-section"></div>
</template>

<script>
import Plotly from 'plotly.js-dist';

export default {
    inject: ['openmct', 'domainObject', 'objectPath'],
    data: function () {

        return {
            telemetryObjects: []
            // currentDomainObject: this.domainObject
        }
    },
    mounted() {
        // this.composition = this.openmct.composition.get(this.domainObject);
        // this.composition.on('add', this.addTelemetry);
        // this.composition.load();
        // this.addTelemetryObject(this.domainObject);
        this.metadata = this.openmct.telemetry.getMetadata(this.domainObject);

        console.log('this.metadata', this.metadata);

        // this.keystring = this.openmct.objects.makeKeyString(this.domainObject.identifier);
        // this.subscribe(this.domainObject);
        let plot = document.querySelector('.l-view-section');
        Plotly.newPlot(plot, [{
            x: [1, 2, 3, 4, 5],
            y: [1, 2, 4, 8, 16]
        }], this.getLayout(), {displayModeBar: false});
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
                    zeroline: false,
                    hoverformat: ".2r"
                },
                yaxis: {
                    // title: this.plotAxisTitle.yAxisTitle,
                    zeroline: false,
                    hoverformat: ".2r"
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
        addTelemetryObject(telemetryObject) {
            return this.openmct.telemetry.request(telemetryObject)
                .then(telemetryData => {
                    console.log('telemetryData', telemetryData);
                });
        },
        subscribe(domainObject) {
            this.date = ''
            this.openmct.objects.get(this.keystring)
                .then((object) => {
                    const metadata = this.openmct.telemetry.getMetadata(this.domainObject);
                    console.log('metadata', metadata);
                    // this.timeKey = this.openmct.time.timeSystem().key;
                    // this.timeFormat = this.openmct.telemetry.getValueFormatter(metadata.value(this.timeKey));
                    // // this.imageFormat = this.openmct.telemetry.getValueFormatter(metadata.valuesForHints(['image'])[0]);
                    // this.unsubscribe = this.openmct.telemetry
                    //     .subscribe(this.domainObject, (datum) => {
                    //         this.updateHistory(datum);
                    //         this.updateValues(datum);
                    //     });

                    // this.requestHistory(this.openmct.time.bounds());
                });
        },
    }
}
</script>
