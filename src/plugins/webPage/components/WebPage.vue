<template>
<div class="l-iframe abs">
    <iframe :src="currentDomainObject.url"></iframe>
</div>
</template>

<script>
// eslint-disable-next-line no-unused-vars
import Plotly from 'plotly.js-gl2d-dist-min';

export default {
    inject: ['openmct', 'domainObject'],
    data: function () {
        return {
            currentDomainObject: this.domainObject
        }
    }
}
</script>
