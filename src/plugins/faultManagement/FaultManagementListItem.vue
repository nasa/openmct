<template>
<div class="c-fault-mgmt-list-header">
    {{ fault.id.name }}
    {{ fault.id.namespace }}
</div>
</template>

<script>
export default {
    components: {
    },
    inject: ['openmct', 'domainObject'],
    props: {
        fault: {
            type: Object,
            required: true
        }
    },
    data() {
        return {
        };
    },
    computed: {
    },
    watch: {
    },
    mounted() {
        console.log(this.fault);
        console.log(this.fault.severity);
        console.log(this.fault.id.name);
        console.log(this.fault.id.namespace);
        console.log(this.fault.parameterDetail.triggerValue.engValue.doubleValue);
        console.log(this.fault.parameterDetail.currentValue.engValue.doubleValue);
        console.log(this.fault.triggerTime);
    },
    beforeDestroy() {
    },
    methods: {
    }
};
</script>
