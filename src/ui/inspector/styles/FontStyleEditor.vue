<template>
<div class="c-toolbar">
    <toolbar-select-menu
        :options="fontSizeMenuOptions"
        @change="setFontSize"
    />
    <toolbar-select-menu
        :options="fontMenuOptions"
        @change="setFont"
    />
</div>
</template>

<script>
import ToolbarSelectMenu from '@/ui/toolbar/components/toolbar-select-menu.vue';

import {
    SMALL_FONT_SIZES,
    LARGE_FONT_SIZES,
    FONTS
} from '@/ui/inspector/styles/constants';

const NON_SPECIFIC = '??';

export default {
    inject: ['openmct'],
    components: {
        ToolbarSelectMenu
    },
    props: {
        styleables: {
            type: Array,
            required: true
        },
        domainObject: {
            type: Object,
            required: true
        }
    },
    computed: {
        objectStyles() {
            const objectStyles = Object.assign(
                {},
                this.domainObject.configuration && this.domainObject.configuration.objectStyles
            );

            this.styleables.forEach(styleable => {
                const item = styleable[0].context.item;
                const layoutItem = styleable[0].context.layoutItem;
                const id = item && item.id ? item.id : layoutItem.id;

                if (!objectStyles[id]) {
                    objectStyles[id] = {};
                }

                if (!objectStyles[id].fontStyle) {
                    objectStyles[id].fontStyle = {
                        fontSize: layoutItem ? layoutItem.fontSize : 'default',
                        font: layoutItem ? layoutItem.font : 'default'
                    };
                }
            });

            return objectStyles;
        },
        consolidatedFontStyle() {
            const objectStyles = this.objectStyles;
            const styles = [];

            this.styleables.forEach(styleable => {
                const item = styleable[0].context.item;
                const layoutItem = styleable[0].context.layoutItem;
                const id = item && item.id ? item.id : layoutItem.id;
                const fontStyle = objectStyles[id].fontStyle;

                styles.push(fontStyle);
            });

            const hasConsolidatedFontSize = styles.length && styles.every((fontStyle, i, arr) => fontStyle.fontSize === arr[0].fontSize);
            const hasConsolidatedFont = styles.length && styles.every((fontStyle, i, arr) => fontStyle.font === arr[0].font);
            const consolidatedFontStyle = {
                fontSize: hasConsolidatedFontSize ? styles[0].fontSize : NON_SPECIFIC,
                font: hasConsolidatedFont ? styles[0].font : NON_SPECIFIC
            };

            return consolidatedFontStyle;
        },
        fontMenuOptions() {
            return {
                control: 'select-menu',
                icon: "icon-font",
                title: "Set font style",
                value: this.consolidatedFontStyle.font,
                options: FONTS
            };
        },
        fontSizeMenuOptions() {
            return {
                control: 'select-menu',
                icon: "icon-font-size",
                title: "Set font size",
                value: this.consolidatedFontStyle.fontSize,
                options: this.availableFontSizeOptions
            };
        },
        availableFontSizeOptions() {
            let sizeOptions = 'big';

            this.styleables.forEach(styleable => {
                if (styleable[0].context.item) {
                    if (styleable[0].context.item.type.includes('plot')
                    || styleable[0].context.item.type.includes('table')) {
                        sizeOptions = 'small';
                    }
                }
            });

            if (sizeOptions === 'small') {
                return SMALL_FONT_SIZES;
            } else {
                return SMALL_FONT_SIZES.concat(LARGE_FONT_SIZES);
            }
        }
    },
    methods: {
        updateStyleValue(value, item) {
            value = this.normalizeValueForStyle(value);
            if (item.property === 'border') {
                value = '1px solid ' + value;
            }

            if (value && (value.url !== undefined)) {
                this.styleItem.style[item.property] = value.url;
            } else {
                this.styleItem.style[item.property] = value;
            }

            this.$emit('persist', this.styleItem, item.property);
        },
        setFont(font, item) {
            const fontStyle = {
                ...this.consolidatedFontStyle,
                font: font
            };

            this.setFontStyle(fontStyle, 'font');
        },
        setFontSize(fontSize, item) {
            const fontStyle = {
                ...this.consolidatedFontStyle,
                fontSize: fontSize
            };

            this.setFontStyle(fontStyle, 'fontSize');
        },
        setFontStyle(style, property) {
            const objectStyles = this.objectStyles;

            this.styleables.forEach(styleable => {
                const item = styleable[0].context.item;
                const layoutItem = styleable[0].context.layoutItem;
                const id = item && item.id ? item.id : layoutItem.id;

                objectStyles[id].fontStyle[property] = style[property];
            });

            this.openmct.objects.mutate(this.domainObject, 'configuration.objectStyles', objectStyles);
        }
    }
};
</script>
