<template>
<div>
    <div v-if="condition"
         class="holder c-c-button-wrapper align-left"
    >
        <div>{{ condition.configuration.name }}</div>
        <div :style="conditionStyle">ABC</div>
    </div>
</div>
</template>

<script>

export default {
    components: {
    },
    inject: [
        'openmct'
    ],
    props: {
        conditionIdentifier: {
            type: Object,
            required: true
        },
        conditionStyle: {
            type: Object,
            required: true
        }
    },
    data() {
        return {
            condition: null
        }
    },
    destroyed() {
    },
    mounted() {
        this.openmct.objects.get(this.conditionIdentifier).then((conditionDomainObject) => {
            this.condition = conditionDomainObject;
        });
    }
}
</script>
