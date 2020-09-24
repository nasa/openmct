<template>
<div class="c-toolbar">
    <toolbar-select-menu
        :options="fontSizeMenuOptions"
        @change="updateFontSize"
    />
    <toolbar-select-menu
        :options="fontMenuOptions"
        @change="updateFont"
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

export default {
    components: {
        ToolbarSelectMenu
    },
    props: {
        styleables: {
            type: Array,
            required: true
        },
        objectStyles: {
            type: Object,
            required: true
        }
    },
    computed: {
        
        fontMenuOptions() {
            return {
                control: 'select-menu',
                icon: "icon-font",
                title: "Set font style",
                value: this.font,
                options: FONTS
            };
        },
        fontSizeMenuOptions() {
            return {
                control: 'select-menu',
                icon: "icon-font-size",
                title: "Set font size",
                value: this.fontSize,
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
    mounted() {
        // console.log(this.styleables);
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
        updateFont() {

        },
        updateFontSize() {

        }
    }
};
</script>
