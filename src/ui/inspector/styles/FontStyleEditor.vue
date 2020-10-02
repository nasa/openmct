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

export default {
    inject: ['openmct'],
    components: {
        ToolbarSelectMenu
    },
    props: {
        fontStyle: {
            type: Object,
            required: true
        },
        fontSizeSet: {
            type: String,
            required: true
        },
        allowEditing: {
            type: Boolean,
            required: true
        }
    },
    computed: {
        fontMenuOptions() {
            return {
                control: 'select-menu',
                icon: "icon-font",
                title: "Set font style",
                value: this.fontStyle.font,
                options: FONTS
            };
        },
        fontSizeMenuOptions() {
            return {
                control: 'select-menu',
                icon: "icon-font-size",
                title: "Set font size",
                value: this.fontStyle.fontSize,
                options: this.availableFontSizeOptions
            };
        },
        availableFontSizeOptions() {
            if (this.fontSizeSet === 'small') {
                return SMALL_FONT_SIZES;
            } else {
                return SMALL_FONT_SIZES.concat(LARGE_FONT_SIZES);
            }
        }
    },
    methods: {
        setFont(font) {
            const property = {
                font: font
            };
            // this.setFontStyle(font, 'font');
            this.$emit('set-font-property', property);
        },
        setFontSize(fontSize) {
            const property = {
                fontSize: fontSize
            };
            // this.setFontStyle(fontSize, 'fontSize');
            this.$emit('set-font-property', property);
        }
    }
};
</script>
