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
        styleableItems: {
            type: Array,
            required: true
        }
    },
    computed: {
        fontMenuOptions() {
            return {
                control: 'select-menu',
                // domainObject: selectedParent,
                icon: "icon-font",
                // applicableSelectedItems: selection,
                // property: (selectionPath) => {
                //     return getPath(selectionPath) + '.font';
                // },
                title: "Set font style",
                options: FONTS
            };
        },
        fontSizeMenuOptions() {
            return {
                control: 'select-menu',
                // domainObject: selectedParent,
                icon: "icon-font-size",
                // applicableSelectedItems: selection,
                // property: (selectionPath) => {
                //     return getPath(selectionPath) + '.fontSize';
                // },
                title: "Set font size",
                options: this.availableFontSizeOptions
            };
        },
        availableFontSizeOptions() {
            let sizeOptions = 'big';

            this.styleableItems.forEach(styleable => {
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
        console.log(this.styleableItems);
    },
    methods: {
        updateFont() {

        },
        updateFontSize() {

        }
    }
};
</script>
