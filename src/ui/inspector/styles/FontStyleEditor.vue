<template>
<div class="c-toolbar">
    <toolbar-select-menu
        :options="fontSizeMenuOptions"
        @change="setFontSize"
        class="menus-to-left menus-no-icon"
    />
    <div class="c-toolbar__separator"></div>
    <toolbar-select-menu
        :options="fontMenuOptions"
        @change="setFont"
        class="menus-to-left menus-no-icon"
    />
</div>
</template>

<script>
import ToolbarSelectMenu from '@/ui/toolbar/components/toolbar-select-menu.vue';

import {
    FONT_SIZES,
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
                options: FONT_SIZES
            };
        }
    },
    methods: {
        setFont(font) {
            this.$emit('set-font-property', { font: font });
        },
        setFontSize(fontSize) {
            this.$emit('set-font-property', { fontSize: fontSize });
        }
    }
};
</script>
