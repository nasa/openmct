<template>
<div>
    <div v-if="conditionStyle"
         class="holder c-c-button-wrapper align-left"
    >
        <div>{{ conditionStyle.conditionName }}</div>
        <div class="c-toolbar">
            <span :style="conditionStyle.style">ABC</span>
            <toolbar-color-picker v-if="conditionStyle.style.border"
                                  :options="borderColorOption"
                                  @change="updateStyleValue"
            />
            <toolbar-color-picker v-if="conditionStyle.style.backgroundColor"
                                  :options="backgroundColorOption"
                                  @change="updateStyleValue"
            />
            <toolbar-color-picker v-if="conditionStyle.style.color"
                                  :options="colorOption"
                                  @change="updateStyleValue"
            />
            <toolbar-button v-if="conditionStyle.style.imageUrl"
                            :options="imageUrlOption"
                            @change="updateStyleValue"
            />
        </div>
    </div>
</div>
</template>

<script>

import ToolbarColorPicker from "@/ui/toolbar/components/toolbar-color-picker.vue";
import ToolbarButton from "@/ui/toolbar/components/toolbar-button.vue";
export default {
    components: {
        ToolbarButton,
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
        },
        colorOption() {
            return {
                icon: 'icon-font',
                title: 'Set text color',
                value: this.conditionStyle.style.color,
                property: 'color'
            }
        },
        imageUrlOption() {
            return {
                icon: 'icon-image',
                title: 'Edit image properties',
                dialog: {
                    name: "Image Properties",
                    sections: [
                        {
                            rows: [
                                {
                                    key: "url",
                                    control: "textfield",
                                    name: "Image URL",
                                    "cssClass": "l-input-lg",
                                    required: true
                                }
                            ]
                        }
                    ]
                },
                property: 'imageUrl',
                formKeys: ['url'],
                value: {url: this.conditionStyle.style.imageUrl}
            }
        }
    },
    methods: {
        updateStyleValue(value, item) {
            if (item.property === 'border') {
                value = '1px solid ' + value;
            }
            if (value && value.url) {
                this.conditionStyle.style[item.property] = value.url;
            } else {
                this.conditionStyle.style[item.property] = value;
            }
            this.$emit('persist', this.conditionStyle);
        }
    }
}
</script>
