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
        this.itemId = this.item.id;
        this.objectStyle = this.getObjectStyleForItem(this.domainObject.configuration.objectStyles);
        this.initObjectStyles();
    },
    destroyed() {
        if (this.stopListeningObjectStyles) {
            this.stopListeningObjectStyles();
        }
    },
    methods: {
        getObjectStyleForItem(objectStyle) {
            if (objectStyle) {
                return objectStyle[this.itemId] ? Object.assign({}, objectStyle[this.itemId]) : undefined;
            } else {
                return undefined;
            }
        },
        initObjectStyles() {
            if (!this.styleRuleManager) {
                this.styleRuleManager = new StyleRuleManager(this.objectStyle, this.openmct, this.updateStyle.bind(this));
            } else {
                this.styleRuleManager.updateObjectStyleConfig(this.objectStyle);
            }

            if (this.stopListeningObjectStyles) {
                this.stopListeningObjectStyles();
            }

            this.stopListeningObjectStyles = this.openmct.objects.observe(this.domainObject, 'configuration.objectStyles', (newObjectStyle) => {
                //Updating object styles in the inspector view will trigger this so that the changes are reflected immediately
                let newItemObjectStyle = this.getObjectStyleForItem(newObjectStyle);
                if (this.objectStyle !== newItemObjectStyle) {
                    this.objectStyle = newItemObjectStyle;
                    this.styleRuleManager.updateObjectStyleConfig(this.objectStyle);
                }
            });
        },
        updateStyle(style) {
            this.itemStyle = style;
            let keys = Object.keys(this.itemStyle);
            keys.forEach((key) => {
                if ((typeof this.itemStyle[key] === 'string') && (this.itemStyle[key].indexOf('transparent') > -1)) {
                    delete this.itemStyle[key];
                }
            });
        }
    }
};
