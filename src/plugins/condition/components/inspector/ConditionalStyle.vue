<template>
<div>
    <div v-if="conditionStyle"
         class="holder c-c-button-wrapper align-left"
    >
        <div>{{ conditionStyle.conditionName }}</div>
        <span :style="conditionStyle.style">ABC</span>
        <toolbar-color-picker v-if="conditionStyle.style.border"
                              :options="borderColorOption"
                              @change="updateStyleValue"
        />
        <toolbar-color-picker v-if="conditionStyle.style.backgroundColor"
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
                value: this.conditionStyle.style.border.replace('1px solid ', ''),
                property: 'border'
            }
        },
        backgroundColorOption() {
            return {
                icon: 'icon-paint-bucket',
                title: 'Set background color',
                value: this.conditionStyle.style.backgroundColor,
                property: 'backgroundColor'
            }
        }
    },
    methods: {
        updateStyleValue(value, item) {
            if (item.property === 'border') {
                value = '1px solid ' + value;
            }
            this.conditionStyle.style[item.property] = value;
            this.$emit('persist', this.conditionStyle)
        }
    }
}
</script>
