<template>
<div>
    <div v-if="conditionStyle"
         class="holder c-c-button-wrapper align-left"
    >
        <div v-if="condition">
            <span>{{ condition.configuration.name }}</span>
            <span v-for="criterionDescription in criterionDescriptions"
                  :key="criterionDescription"
            >
                {{ criterionDescription }}
            </span>
        </div>
        <div class="c-toolbar">
            <span :style="conditionStyle.style">ABC</span>
            <span v-if="isEditing">
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
            </span>
        </div>
    </div>
</div>
</template>

<script>

import ToolbarColorPicker from "@/ui/toolbar/components/toolbar-color-picker.vue";
import ToolbarButton from "@/ui/toolbar/components/toolbar-button.vue";
import {TRIGGER} from "@/plugins/condition/utils/constants";
import { OPERATIONS } from "@/plugins/condition/utils/operations";

export default {
    name: 'StyleEditor',
    components: {
        ToolbarButton,
        ToolbarColorPicker
    },
    inject: [
        'openmct'
    ],
    props: {
        isEditing: {
            type: Boolean
        },
        conditionStyle: {
            type: Object,
            required: true
        },
        condition: {
            type: Object,
            default() {
                return undefined;
            }
        }
    },
    data() {
        return {
            criterionDescriptions: []
        }
    },
    computed: {
        borderColorOption() {
            return {
                icon: 'icon-line-horz',
                title: 'Set border color',
                value: this.conditionStyle.style.border.replace('1px solid ', ''),
                property: 'border',
                isEditing: this.isEditing
            }
        },
        backgroundColorOption() {
            return {
                icon: 'icon-paint-bucket',
                title: 'Set background color',
                value: this.conditionStyle.style.backgroundColor,
                property: 'backgroundColor',
                isEditing: this.isEditing
            }
        },
        colorOption() {
            return {
                icon: 'icon-font',
                title: 'Set text color',
                value: this.conditionStyle.style.color,
                property: 'color',
                isEditing: this.isEditing
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
                value: {url: this.conditionStyle.style.imageUrl},
                isEditing: this.isEditing
            }
        }
    },
    mounted() {
        this.getConditionDescription();
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
        },
        getConditionDescription() {
            if (this.condition) {
                this.criterionDescriptions = [];
                this.condition.configuration.criteria.forEach((criterion, index) => {
                    if (!criterion.isDefault) {
                        this.getCriterionDescription(criterion, index);
                    }
                });
            }
        },
        getCriterionDescription(criterion, index) {
            const triggerDescription = this.condition.trigger === TRIGGER.ANY ? ' or ' : ' and ';
            if(criterion.telemetry) {
                this.openmct.objects.get(criterion.telemetry).then((telemetryObject) => {
                    let description = `${telemetryObject.name} ${criterion.metadata} ${this.getOperatorText(criterion.operation)} ${criterion.input.join(', ')}`;
                    if (!index) {
                        description = 'When ' + description;
                    }
                    if (index !== this.condition.configuration.criteria.length -1) {
                        description = description + triggerDescription;
                    }
                    this.criterionDescriptions.splice(index, 0, description);
                });
            }
        },
        getOperatorText(operationName) {
            const found = OPERATIONS.find((operation) => operation.name === operationName);
            return found ? found.shortText || found.text : '';
        }
    }
}
</script>
