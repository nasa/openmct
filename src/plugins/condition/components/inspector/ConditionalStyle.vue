<template>
<div>
    <div v-if="condition"
         class="holder c-c-button-wrapper align-left"
    >
        <div>{{ condition.configuration.name }}</div>
        <span :style="conditionStyle">ABC</span>
        <toolbar-color-picker v-if="conditionStyle.border"
                              :options="borderColorOption"
                              @change="updateStyleValue"
        />
        <toolbar-color-picker v-if="conditionStyle.backgroundColor"
                              :options="backgroundColorOption"
                              @change="updateStyleValue"
        />
    </div>
</div>
</template>

<script>

import ToolbarColorPicker from "@/ui/toolbar/components/toolbar-color-picker.vue";
export default {
    components: {
        ToolbarColorPicker
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
    computed: {
        borderColorOption() {
            return {
                icon: 'icon-line-horz',
                title: 'Set border color',
                value: this.conditionStyle.border.replace('1px solid ', ''),
                property: 'border'
            }
        },
        backgroundColorOption() {
            return {
                icon: 'icon-paint-bucket',
                title: 'Set background color',
                value: this.conditionStyle.backgroundColor,
                property: 'backgroundColor'
            }
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
        updateStyleValue(value, item) {
            if (item.property === 'border') {
                value = '1px solid ' + value;
            }
            this.conditionStyle[item.property] = value;
            this.$emit('persist', this.conditionIdentifier, this.conditionStyle)
        }
    }
}
</script>
