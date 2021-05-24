<template>
<!-- If only one Activity is selected -->
<div v-if="timeProperties.length"
     class="u-contents"
>
    <div class="c-inspect-properties__header">
        {{ heading }}
    </div>
    <ul v-for="(timeProperty, index) in timeProperties"
        :key="index"
        class="c-inspect-properties__section"
    >
        <activity-property :label="timeProperty.label"
                           :value="timeProperty.value"
        />
    </ul>
</div>
</template>

<script>
import ActivityProperty from './ActivityProperty.vue';

export default {
    components: {
        ActivityProperty
    },
    props: {
        activity: {
            type: Object,
            required: true
        },
        heading: {
            type: String,
            required: true
        }
    },
    data() {
        return {
            timeProperties: []
        };
    },
    mounted() {
        this.setProperties();
    },
    methods: {
        setProperties() {
            Object.keys(this.activity).forEach((key, index) => {
                const label = this.activity[key].label;
                const value = String(this.activity[key].value);

                this.$set(this.timeProperties, index, {
                    label,
                    value
                });
            });
        }
    }
};
</script>
