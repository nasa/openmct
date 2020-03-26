<template>
<a class="c-condition-widget"
   :href="internalDomainObject.url"
>
    <div class="c-condition-widget__label">
        {{ internalDomainObject.label }}
    </div>
</a>
</template>

<script>
export default {
    inject: ['openmct', 'domainObject'],
    data: function () {
        return {
            internalDomainObject: this.domainObject
        }
    },
    mounted() {
        this.unlisten = this.openmct.objects.observe(this.internalDomainObject, '*', this.updateInternalDomainObject);
    },
    beforeDestroy() {
        if (this.unlisten) {
            this.unlisten();
        }
    },
    methods: {
        updateInternalDomainObject(domainObject) {
            this.internalDomainObject = domainObject;
        }
    }
}
</script>
