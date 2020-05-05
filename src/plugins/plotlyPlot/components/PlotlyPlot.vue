<template>
<div class="l-iframe abs">
    <div id="tester" style="width:600px;height:250px;"></div>
</div>
</template>

<script>
import Plotly from 'plotly.js-dist'

export default {
    inject: ['openmct', 'domainObject'],
    data: function () {
        return {
            currentDomainObject: this.domainObject
        }
    },
    mounted() {
        let TESTER = document.getElementById('tester');
        Plotly.newPlot(TESTER, [{
            x: [1, 2, 3, 4, 5],
            y: [1, 2, 4, 8, 16] }], {
            margin: {t: 0} });
    }
}
</script>
