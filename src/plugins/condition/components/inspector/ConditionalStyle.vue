<template>
<div>
    {{conditionStyle}}
    <div v-if="conditionStyle.conditionId"
         class="holder c-c-button-wrapper align-left"
    >
        <div>{{ conditionStyle.conditionName }}</div>
        <span :style="conditionStyle.style">ABC</span>
        <span style="margin-left: 20px;display: inline-block; vertical-align: middle;">
            <toolbar-color-picker v-if="conditionStyle.style.border"
                                  :options="borderColorOption"
                                  @change="updateStyleValue"
            />
        </span>
        <span style="display: inline-block; vertical-align: middle;">
            <toolbar-color-picker v-if="conditionStyle.style.backgroundColor"
                                  :options="backgroundColorOption"
                                  @change="updateStyleValue"
            />
        </span>
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
            this.$emit('persist', this.conditionStyle.conditionId, this.conditionStyle.style);
        }
    }
}
</script>
