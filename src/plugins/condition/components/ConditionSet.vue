<template>
<div><!-- Condition Set component contents will go here --></div>
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
