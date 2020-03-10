<template>
<div>
    <div v-if="!conditionalStyles.length"
         class="holder c-c-button-wrapper align-left"
    >
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
        <div class="c-properties__row--span-all">
            <div class="controls">
                <div class="preview">ABC</div>
                <button v-for="(item, index) in defaults"
                        :key="index"
                        class="c-icon-button--swatched"
                        :class="item.iconClass"
                        :data-style-prop="item.name"
                        @click="applyStyle(index)"
                ></button>
            </div>
        </div>
    </div>
</div>
</template>

<script>

export default {
    name: 'ConditionalStylesView',
    inject: [
        'openmct',
        'domainObject',
        'layoutItem'
    ],
    data() {
        return {
            conditionalStyles: [],
            defaults: [
                {   name: 'backgroundColor',
                    iconClass: 'icon-paint-bucket',
                    value: '#666'
                },
                {   name: 'borderColor',
                    iconClass: 'icon-line-horz',
                    value: '#000'
                },
                {   name: 'color',
                    iconClass: 'icon-font',
                    value: '#ccc'
                }
            ]
        }
    },
    mounted() {
        if (this.layoutItem) {
            //TODO: Handle layout items
        }
        if (this.domainObject.configuration) {
            this.defautStyle = this.domainObject.configuration.defaultStyle;
            if (this.domainObject.configuration.conditionalStyle) {
                this.conditionalStyles = this.domainObject.configuration.conditionalStyle.styles || [];
            }
        }
    },
    methods: {
        applyStyle(index) {
            const propName = event.target.dataset.styleProp;
            const previewElem = event.target.closest('.controls').querySelector('.preview')
            previewElem.style[`${propName}`] = this.defaults[index].value;
            event.target.setAttribute(`style`, `border-bottom: solid 2px ${this.defaults[index].value};`)
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
            this.conditionSetIdentifier = '';
            this.conditionalStyles = [];
            this.persist(undefined);
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
                this.persist({
                    defaultStyle: this.defaultStyle || {backgroundColor: 'inherit'},
                    conditionSetIdentifier: this.conditionSetIdentifier,
                    styles: this.conditionalStyles
                });
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

