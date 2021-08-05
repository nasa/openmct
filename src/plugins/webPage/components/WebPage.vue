<template>
<div class="l-iframe abs">
    <iframe :src="currentDomainObject.url"></iframe>
</div>
</template>

<script>
export default {
    inject: ['openmct', 'domainObject'],
    data: function () {
        return {
            currentDomainObject: this.domainObject
        };
    }
};
</script>
