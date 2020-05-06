<template>
<div class="l-view-section">
    <div class="plot"></div>
</div>
</template>

<script>
import Plotly from 'plotly.js-dist';

export default {
    inject: ['openmct', 'domainObject'],
    data: function () {
        return {
            currentDomainObject: this.domainObject
        }
    },
    mounted() {
        let plot = document.querySelector('.plot');
        Plotly.newPlot(plot, [{
            x: [1, 2, 3, 4, 5],
            y: [1, 2, 4, 8, 16]
        }], this.getLayout());
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
    }
}
</script>
