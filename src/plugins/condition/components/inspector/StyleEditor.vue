<template>
<div class="c-style-editor">
    <div v-for="(error, index) in conditionErrors"
         :key="index"
    >
        <span :class="error.message.icon"></span>
        <span>{{ error.message.errorText }}
            <span v-if="error.additionalInfo">{{ error.additionalInfo }}</span>
        </span>
    </div>
    <div v-if="condition">
        <span>{{ condition.configuration.name }}</span>
        <span v-for="(criterionDescription, index) in criterionDescriptions"
              :key="criterionDescription.description"
        >
            <span v-if="!index">When </span>
            {{ criterionDescription.description }}
            <span v-if="index < (criterionDescriptions.length-1)">{{ triggerDescription }}</span>
        </span>
    </div>
    <div class="c-style__thumb-and-toolbar">
        <span class="c-style-thumb"
              :style="conditionStyle.style"
        >
            <span class="c-style-thumb__text"
                  :class="{ 'hide-nice': !conditionStyle.style.color }"
            >
                ABC
            </span>
        </span>
        <span v-if="isEditing"
              class="c-toolbar"
        >
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
            criterionDescriptions: [],
            triggerDescription: '',
            conditionErrors: [],
            ERROR: {
                'TELEMETRY_NOT_FOUND': {
                    errorText: 'Telemetry not found',
                    icon: 's-status-icon-warning-hi'
                },
                'CONDITION_NOT_FOUND': {
                    errorText: 'Condition not found',
                    icon: 's-status-icon-warning-hi'
                }
            }
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
                this.triggerDescription = this.condition.configuration.trigger === TRIGGER.ANY ? ' or ' : ' and ';
                this.criterionDescriptions = [];
                this.condition.configuration.criteria.forEach((criterion, index) => {
                    this.getCriterionDescription(criterion, index);
                });
                if (this.condition.isDefault) {
                    this.criterionDescriptions.splice(0, 0, {
                        description: 'all else fails'
                    });
                }
            } else if (this.conditionStyle.conditionId !== 'default') {
                //couldn't find the condition. That's bad!
                this.conditionErrors = [{
                    message: this.ERROR.CONDITION_NOT_FOUND,
                    additionalInfo: `Condition Id: ${this.conditionStyle.conditionId}`
                }];
            }
        },
        getCriterionDescription(criterion, index) {
            if(criterion.telemetry) {
                this.openmct.objects.get(criterion.telemetry).then((telemetryObject) => {
                    let description = `${telemetryObject.name} ${criterion.metadata} ${this.getOperatorText(criterion.operation, criterion.input)}`;
                    this.criterionDescriptions.splice(index, 0, {
                        description
                    });
                });
            } else {
                let description = `Unknown ${criterion.metadata} ${this.getOperatorText(criterion.operation, criterion.input)}`;
                this.criterionDescriptions.splice(index, 0, {
                    description
                });
                this.conditionErrors.push({
                    message: this.ERROR.TELEMETRY_NOT_FOUND,
                    additionalInfo: `Key: ${this.openmct.objects.makeKeyString(criterion.telemetry)}`
                });
            }
        },
        getOperatorText(operationName, values) {
            const found = OPERATIONS.find((operation) => operation.name === operationName);
            return found ? found.getDescription(values) : '';
        }
    }
}
</script>
