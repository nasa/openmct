<template>
<div><!--Stuff goes here--></div>
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
