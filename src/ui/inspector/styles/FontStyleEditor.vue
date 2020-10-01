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
        allowEditing: {
            type: Boolean,
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

                fontStyle = item && item.configuration && item.configuration.fontStyle;
                if (!fontStyle) {
                    fontStyle = {
                        fontSize: layoutItem ? layoutItem.fontSize : 'default',
                        font: layoutItem ? layoutItem.font : 'default'
                    };                    
                }

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
        setFont(font, item) {
            this.setFontStyle(font, 'font');
        },
        setFontSize(fontSize, item) {
            this.setFontStyle(fontSize, 'fontSize');
        },
        setFontStyle(value, property) {
            let layoutDomainObject;

            this.styleables.forEach(styleable => {
                const item = styleable[0].context.item;
                const layoutItem = styleable[0].context.layoutItem;

                if (!this.isLayoutObject(styleable)) {
                    let fontStyle = item.configuration && item.configuration.fontStyle;

                    // legacy font style support
                    if (!fontStyle) {
                        fontStyle = {
                            fontSize: layoutItem && layoutItem.fontSize || 'default',
                            font: layoutItem && layoutItem.font || 'default'
                        };
                    }

                    fontStyle[property] = value;

                    this.openmct.objects.mutate(item, 'configuration.fontStyle', fontStyle);
                } else {
                    // all layoutItems in this context will share same parent layout
                    if (!layoutDomainObject) {
                        layoutDomainObject = styleable[1].context.item;
                    }

                    // save layout item font style to parent layout configuration
                    const layoutItemIndex = styleable[0].context.index;
                    const layoutItemConfiguration = layoutDomainObject.configuration.items[layoutItemIndex];
                    
                    layoutItemConfiguration[property] = value;
                }                
            });

            if (layoutDomainObject) {
                this.openmct.objects.mutate(layoutDomainObject, 'configuration.items', layoutDomainObject.configuration.items);
            }
        },
        isLayoutObject(selectionPath) {
            const layoutItemType = selectionPath[0].context.layoutItem && selectionPath[0].context.layoutItem.type;

            return layoutItemType && layoutItemType !== 'subobject-view';
        }
    }
};
</script>
