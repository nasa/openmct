<template>
<div>
    <div v-if="condition"
         class="holder c-c-button-wrapper align-left"
    >
        <div>{{ condition.configuration.name }}</div>
        <div>Background Color
            <span class="icon-box-round-corners"
                  :style=conditionStyle
            ></span></div>
    </div>
</div>
</template>

<script>

export default {
    components: {
    },
    inject: [
        'openmct',
        'context'
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
    },
    methods: {
    }
}
</script>
