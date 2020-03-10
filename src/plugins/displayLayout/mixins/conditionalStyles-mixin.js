import StyleRuleManager from "@/plugins/condition/StyleRuleManager";

export default {
    inject: ['openmct'],
    data() {
        return {
            itemStyle: this.itemStyle
        }
    },
    mounted() {
        this.domainObject = this.$parent.domainObject;
        console.log(this.itemId);
        this.itemId = this.item.id;
        console.log(this.itemId);
        this.conditionalStyle = this.getConditionalStyleForItem(this.domainObject.configuration.conditionalStyle);
        this.initConditionalStyles();
    },
    destroyed() {
        if (this.stopListeningConditionalStyles) {
            this.stopListeningConditionalStyles();
        }
    },
    methods: {
        getConditionalStyleForItem(conditionalStyle) {
            if (conditionalStyle) {
                return conditionalStyle[this.itemId];
            } else {
                return undefined;
            }
        },
        initConditionalStyles() {
            if (!this.styleRuleManager) {
                this.styleRuleManager = new StyleRuleManager(this.conditionalStyle, this.openmct);
                this.styleRuleManager.on('conditionalStyleUpdated', this.updateStyle.bind(this));
            } else {
                this.styleRuleManager.updateConditionalStyleConfig(this.conditionalStyle);
            }

            if (this.stopListeningConditionalStyles) {
                this.stopListeningConditionalStyles();
            }

            this.stopListeningConditionalStyles = this.openmct.objects.observe(this.domainObject, 'configuration.conditionalStyle', (newConditionalStyle) => {
                //Updating conditional styles in the inspector view will trigger this so that the changes are reflected immediately
                let newItemConditionalStyle = this.getConditionalStyleForItem(newConditionalStyle);
                if (this.conditionalStyle !== newItemConditionalStyle) {
                    this.conditionalStyle = newItemConditionalStyle;
                    this.styleRuleManager.updateConditionalStyleConfig(this.conditionalStyle);
                }
            });
        },
        updateStyle(style) {
            this.itemStyle = style;
        }
    }
};
