<template>
<div>
    <div v-if="!conditionalStyles.length"
         class="holder c-c-button-wrapper align-left"
    >
        <div class="c-properties__row--span-all">
            <div class="controls">
                <div class="preview"
                     :class="getObjectType"
                >
                    <template v-if="getObjectType === 'text'">ABC</template>
                </div>
                <button v-for="(item, key) in initialStyles"
                        :key="key"
                        class="c-icon-button--swatched"
                        :class="icons[key]"
                        :data-style-prop="key"
                >
                    <ToolbarColorPicker
                        :options="{key: item}"
                        @click="triggerMethod(item, $event)"
                        @change="applyStyle"
                    />
                </button>
            </div>
        </div>
        <button
            class="c-c-button c-c-button--minor add-criteria-button"
            @click="addConditionSet"
        >
            <span class="c-c-button__label">Use conditional styling</span>
        </button>
    </div>
    <div v-else>
        <div class="holder c-c-button-wrapper align-left">
            <button
                class="c-c-button c-c-button--minor add-criteria-button"
                @click="removeConditionSet"
            >
                <span class="c-c-button__label">Remove conditional styling</span>
            </button>
        </div>
    </div>
</div>
</template>

<script>
import ToolbarColorPicker from '../../../../ui/toolbar/components/toolbar-color-picker.vue';

export default {
    name: 'ConditionalStylesView',
    inject: [
        'openmct',
        'domainObject'
    ],
    components: {
        ToolbarColorPicker
    },
    props: {
        itemId: {
            type: String,
            default: ''
        },
        initialStyles: {
            type: Object,
            required: true
        }
    },
    data() {
        return {
            conditionalStyles: [],
            icons: {
                backgroundColor: 'icon-paint-bucket',
                borderColor: 'icon-line-horz',
                color: 'icon-font'
            }
        }
    },
    computed: {
        getObjectType: function () {
            let objectType = '';
            if (!this.initialStyles.backgroundColor &&
                !this.initialStyles.color) {
                objectType = 'line';
            } else if (this.initialStyles.backgroundColor === 'transparent' &&
                    this.initialStyles.borderColor === 'transparent') {
                objectType = 'text';
            } else if (this.initialStyles.backgroundColor !== 'transparent' &&
                    this.initialStyles.borderColor === 'transparent') {
                objectType = 'box';
            } else {
                objectType = 'image'
            }
            console.log('objectType', objectType)
            return objectType;
        }
    },
    mounted() {
        if (this.domainObject.configuration) {
            if (this.domainObject.configuration.conditionalStyle) {
                if (this.itemId) {
                    let conditionalStyle = this.domainObject.configuration.conditionalStyle[this.itemId];
                    if (conditionalStyle) {
                        this.conditionalStyles = conditionalStyle.styles || [];
                    }
                } else {
                    this.conditionalStyles = this.domainObject.configuration.conditionalStyle.styles || [];
                }
            }
        }
        console.log('initialStyles', this.initialStyles);
    },
    methods: {
        applyStyle(color) {
            const propName = event.target.closest('button').dataset.styleProp;
            const previewElem = event.target.closest('.controls').querySelector('.preview')

            if (this.getObjectType === 'line') {
                let propValue = `linear-gradient(to bottom right, #fff, #fff 46%, ${color} 46%, ${color} 54%, #fff 54%, #fff)`;
                previewElem.style.background = propValue;
            } else {
                previewElem.style[`${propName}`] = color;
            }
        },
        addConditionSet() {
            //TODO: this.conditionSetIdentifier will be set by the UI before calling this
            this.conditionSetIdentifier = {
                namespace: '',
                key: 'bb0f61ad-268d-4d3e-bb30-90ca4a2053c4'
            };
            this.initializeConditionalStyles();
        },
        removeConditionSet() {
            //TODO: Handle the case where domainObject has items with styles but we're trying to remove the styles on the domainObject itself
            this.conditionSetIdentifier = '';
            this.conditionalStyles = [];
            let domainObjectConditionalStyle =  this.domainObject.configuration.conditionalStyle || {};
            if (this.itemId) {
                domainObjectConditionalStyle[this.itemId] = undefined;
                delete domainObjectConditionalStyle[this.itemId];
                if (Object.keys(domainObjectConditionalStyle).length === 0) {
                    domainObjectConditionalStyle = undefined;
                }
                this.persist(domainObjectConditionalStyle);
            } else {
                this.persist(undefined);
            }
        },
        initializeConditionalStyles() {
            const backgroundColors = [{backgroundColor: 'red'},{backgroundColor: 'orange'}, {backgroundColor: 'blue'}];
            this.openmct.objects.get(this.conditionSetIdentifier).then((conditionSetDomainObject) => {
                conditionSetDomainObject.configuration.conditionCollection.forEach((identifier, index) => {
                    this.conditionalStyles.push({
                        conditionIdentifier: identifier,
                        style: backgroundColors[index]
                    });
                });
                let domainObjectConditionalStyle =  this.domainObject.configuration.conditionalStyle || {};
                let conditionalStyle = {
                    defaultStyle: this.defaultStyle || {backgroundColor: 'inherit'},
                    conditionSetIdentifier: this.conditionSetIdentifier,
                    styles: this.conditionalStyles
                };
                if (this.itemId) {
                    this.persist({
                        ...domainObjectConditionalStyle,
                        [this.itemId]: conditionalStyle
                    });
                } else {
                    this.persist(conditionalStyle);
                }
            });
        },
        findStyleByConditionId(id) {
            for(let i=0, ii=this.conditionalStyles.length; i < ii; i++) {
                if (this.openmct.objects.makeKeyString(this.conditionalStyles[i].conditionIdentifier) === this.openmct.objects.makeKeyString(id)) {
                    return {
                        index: i,
                        item: this.conditionalStyles[i]
                    };
                }
            }
        },
        updateConditionalStyle(conditionIdentifier, style) {
            let found = this.findStyleByConditionId(conditionIdentifier);
            if (found) {
                this.conditionalStyles[found.index].style = style;
            }
            this.persist(undefined);
        },
        persist(conditionalStyle) {
            this.openmct.objects.mutate(this.domainObject, 'configuration.conditionalStyle', conditionalStyle);
        }
    }
}
</script>
