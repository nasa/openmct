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
        }
    },
    methods: {
        updateDomainObject(newDomainObject) {
            this.currentDomainObject = newDomainObject;
        }
    },
    mounted() {
        this.unobserve = this.openmct.objects.observe(this.domainObject, '*', this.updateDomainObject);
    },
    destroyed() {
        this.unobserve();
    }
}
</script>
