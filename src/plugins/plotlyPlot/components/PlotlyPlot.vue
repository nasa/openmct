<template>
<div class="l-iframe abs">
    render plot here
</div>
</template>

<script>
export default {
    inject: ['openmct', 'domainObject'],
    data: function () {
        return {
            currentDomainObject: this.domainObject
        }
    }
}
</script>