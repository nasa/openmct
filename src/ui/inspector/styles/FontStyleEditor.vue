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
        consolidatedFontStyle() {
            const styles = [];

            this.styleables.forEach(styleable => {
                let fontStyle;
                const item = styleable[0].context.item;
                const layoutItem = styleable[0].context.layoutItem;
                const parentItem = styleable.length > 1 ? styleable[1].context.item : undefined;
                const id = item ? item.id : layoutItem.id;

                if (parentItem) {
                    fontStyle = parentItem.configuration
                        && parentItem.configuration.objectStyles
                        && parentItem.configuration.objectStyles[id]
                        && parentItem.configuration.objectStyles[id].fontStyle;

                    // legacy support
                    if (!fontStyle) {
                        if (layoutItem.fontSize || layoutItem.font) {
                            fontStyle = {
                                fontSize: layoutItem.fontSize,
                                font: layoutItem.font
                            };
                        }
                    }

                    styles.push(fontStyle);
                }
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
            console.log('update font');
            console.log(this.domainObject);

            const fontStyle = {
                ...this.consolidatedFontStyle,
                font: font
            };

            this.setFontStyle(fontStyle);
        },
        setFontSize(fontSize, item) {
            console.log('update font size');
            const fontStyle = {
                ...this.consolidatedFontStyle,
                fontSize: fontSize
            };

            this.setFontStyle(fontStyle);
        },
        setFontStyle(style) {
            console.log(style);
            // this.openmct.objects.mutate(domainObject, 'configuration.objectStyles', style);
        }
    }
};
</script>
