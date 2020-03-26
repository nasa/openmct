<template>
<div class="c-condition-widget">
    <div class="c-condition-widget__label">
        {{ currentDomainObject.label }}
    </div>
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
