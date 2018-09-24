<template>
    <div class="c-toolbar">
        <div class="c-button-set">
            <div class="c-ctrl-wrapper">
                <div class="c-button--menu js-add-button icon-plus">
                    <div class="c-button__label">Add</div>
                </div>
            </div>
        </div>
        <div class="c-button-set">
            <div class="c-ctrl-wrapper">
                <div class="c-click-icon c-click-icon--menu js-layers icon-layers" @click="toggleLayersMenu"></div>
                <div class="c-menu" v-if="showLayersMenu">
                    <ul>
                        <li v-for="item in layersMenuItems"
                            :class="item.class"
                            :title="item.title">
                            {{ item.name }}
                        </li>
                    </ul>
                </div>
            </div>

            <div class="c-ctrl-wrapper">
                <div class="c-click-icon c-click-icon--swatched js-color-fill icon-paint-bucket"
                     @click="toggleFillPalette">
                    <div class="c-swatch" style="background: #33ff00;"></div>
                </div>
                <div class="c-menu c-palette c-palette--color"
                    v-if="showFillPalette">
                    <div class="c-palette__item-none"
                        vif="this.palette.itemNone === true">
                        <div class="c-palette__item"
                             @click="this.setColor('no-color')"></div>
                        No fill
                    </div>
                    <div class="c-palette__items">
                        <div class="c-palette__item"
                            v-for="color in colorPalette"
                            :style="{ background: color.value }"
                            :title="color.title"
                            @click="this.setColor(color.value)"></div>
                    </div>
                </div>
            </div>

            <div class="c-ctrl-wrapper">
                <div class="c-click-icon c-click-icon--swatched js-color-stroke icon-pencil">
                    <div class="c-toolbar-button__swatch" style="background: #ffffff;"></div>
                </div>
            </div>

            <div class="c-ctrl-wrapper">
                <div class="c-click-icon js-image icon-image"></div>
            </div>
        </div>
        <div class="c-button-set">
            <labeledNumberInput label="X" value="1" title="X position"></labeledNumberInput>
            <labeledNumberInput label="Y" value="2" title="Y position"></labeledNumberInput>
            <labeledNumberInput label="W" value="3" title="Width"></labeledNumberInput>
            <labeledNumberInput label="H" value="4" title="Height"></labeledNumberInput>
        </div>
        <div class="c-button-set">
            <div class="c-click-icon c-click-icon--caution icon-trash"></div>
        </div>
    </div>
</template>

<script>
    import labeledNumberInput from '../controls/labeledNumberInput.vue';

    export default {
        components: {
            labeledNumberInput
        },
        props: {
            showLayersMenu: {
                type: Boolean,
                default: false
            },
            showFillPalette: {
                type: Boolean,
                default: true
            }
        },
        data: function () {
            return {
                layersMenuItems: [
                    { name: 'Move to top', class: 'icon-arrow-double-up', title: 'Move to top' },
                    { name: 'Move up', class: 'icon-arrow-up', title: 'Move up' },
                    { name: 'Move down', class: 'icon-arrow-down', title: 'Move down' },
                    { name: 'Move to bottom', class: 'icon-arrow-double-down', title: 'Move to bottom' }
                ],
                colorPalette: [
                    { name: '#000000', value: '#000000', title: '#000000' },
                    { name: '#434343', value: '#434343', title: '#434343' },
                    { name: '#666666', value: '#666666', title: '#666666' },
                    { name: '#999999', value: '#999999', title: '#999999' },
                    { name: '#b7b7b7', value: '#b7b7b7', title: '#b7b7b7' },
                    { name: '#cccccc', value: '#cccccc', title: '#cccccc' },
                    { name: '#d9d9d9', value: '#d9d9d9', title: '#d9d9d9' },
                    { name: '#efefef', value: '#efefef', title: '#efefef' },
                    { name: '#f3f3f3', value: '#f3f3f3', title: '#f3f3f3' },
                    { name: '#ffffff', value: '#ffffff', title: '#ffffff' },
                    { name: '#980000', value: '#980000', title: '#980000' },
                    { name: '#ff0000', value: '#ff0000', title: '#ff0000' },
                    { name: '#ff9900', value: '#ff9900', title: '#ff9900' },
                    { name: '#ffff00', value: '#ffff00', title: '#ffff00' },
                    { name: '#00ff00', value: '#00ff00', title: '#00ff00' },
                    { name: '#00ffff', value: '#00ffff', title: '#00ffff' },
                    { name: '#4a86e8', value: '#4a86e8', title: '#4a86e8' },
                    { name: '#0000ff', value: '#0000ff', title: '#0000ff' },
                    { name: '#9900ff', value: '#9900ff', title: '#9900ff' },
                    { name: '#ff00ff', value: '#ff00ff', title: '#ff00ff' },
                    { name: '#e6b8af', value: '#e6b8af', title: '#e6b8af' },
                    { name: '#f4cccc', value: '#f4cccc', title: '#f4cccc' },
                    { name: '#fce5cd', value: '#fce5cd', title: '#fce5cd' },
                    { name: '#fff2cc', value: '#fff2cc', title: '#fff2cc' },
                    { name: '#d9ead3', value: '#d9ead3', title: '#d9ead3' },
                    { name: '#d0e0e3', value: '#d0e0e3', title: '#d0e0e3' },
                    { name: '#c9daf8', value: '#c9daf8', title: '#c9daf8' },
                    { name: '#cfe2f3', value: '#cfe2f3', title: '#cfe2f3' },
                    { name: '#d9d2e9', value: '#d9d2e9', title: '#d9d2e9' },
                    { name: '#ead1dc', value: '#ead1dc', title: '#ead1dc' },
                    { name: '#dd7e6b', value: '#dd7e6b', title: '#dd7e6b' },
                    { name: '#dd7e6b', value: '#dd7e6b', title: '#dd7e6b' },
                    { name: '#f9cb9c', value: '#f9cb9c', title: '#f9cb9c' },
                    { name: '#ffe599', value: '#ffe599', title: '#ffe599' },
                    { name: '#b6d7a8', value: '#b6d7a8', title: '#b6d7a8' },
                    { name: '#a2c4c9', value: '#a2c4c9', title: '#a2c4c9' },
                    { name: '#a4c2f4', value: '#a4c2f4', title: '#a4c2f4' },
                    { name: '#9fc5e8', value: '#9fc5e8', title: '#9fc5e8' },
                    { name: '#b4a7d6', value: '#b4a7d6', title: '#b4a7d6' },
                    { name: '#d5a6bd', value: '#d5a6bd', title: '#d5a6bd' },
                    { name: '#cc4125', value: '#cc4125', title: '#cc4125' },
                    { name: '#e06666', value: '#e06666', title: '#e06666' },
                    { name: '#f6b26b', value: '#f6b26b', title: '#f6b26b' },
                    { name: '#ffd966', value: '#ffd966', title: '#ffd966' },
                    { name: '#93c47d', value: '#93c47d', title: '#93c47d' },
                    { name: '#76a5af', value: '#76a5af', title: '#76a5af' },
                    { name: '#6d9eeb', value: '#6d9eeb', title: '#6d9eeb' },
                    { name: '#6fa8dc', value: '#6fa8dc', title: '#6fa8dc' },
                    { name: '#8e7cc3', value: '#8e7cc3', title: '#8e7cc3' },
                    { name: '#c27ba0', value: '#c27ba0', title: '#c27ba0' },
                    { name: '#a61c00', value: '#a61c00', title: '#a61c00' },
                    { name: '#cc0000', value: '#cc0000', title: '#cc0000' },
                    { name: '#e69138', value: '#e69138', title: '#e69138' },
                    { name: '#f1c232', value: '#f1c232', title: '#f1c232' },
                    { name: '#6aa84f', value: '#6aa84f', title: '#6aa84f' },
                    { name: '#45818e', value: '#45818e', title: '#45818e' },
                    { name: '#3c78d8', value: '#3c78d8', title: '#3c78d8' },
                    { name: '#3d85c6', value: '#3d85c6', title: '#3d85c6' },
                    { name: '#674ea7', value: '#674ea7', title: '#674ea7' },
                    { name: '#a64d79', value: '#a64d79', title: '#a64d79' },
                    { name: '#85200c', value: '#85200c', title: '#85200c' },
                    { name: '#990000', value: '#990000', title: '#990000' },
                    { name: '#b45f06', value: '#b45f06', title: '#b45f06' },
                    { name: '#bf9000', value: '#bf9000', title: '#bf9000' },
                    { name: '#38761d', value: '#38761d', title: '#38761d' },
                    { name: '#134f5c', value: '#134f5c', title: '#134f5c' },
                    { name: '#1155cc', value: '#1155cc', title: '#1155cc' },
                    { name: '#0b5394', value: '#0b5394', title: '#0b5394' },
                    { name: '#351c75', value: '#351c75', title: '#351c75' },
                    { name: '#741b47', value: '#741b47', title: '#741b47' },
                    { name: '#5b0f00', value: '#5b0f00', title: '#5b0f00' },
                    { name: '#660000', value: '#660000', title: '#660000' },
                    { name: '#783f04', value: '#783f04', title: '#783f04' },
                    { name: '#7f6000', value: '#7f6000', title: '#7f6000' },
                    { name: '#274e13', value: '#274e13', title: '#274e13' },
                    { name: '#0c343d', value: '#0c343d', title: '#0c343d' },
                    { name: '#1c4587', value: '#1c4587', title: '#1c4587' },
                    { name: '#073763', value: '#073763', title: '#073763' },
                    { name: '#20124d', value: '#20124d', title: '#20124d' },
                    { name: '#4c1130', value: '#4c1130', title: '#4c1130' }
                ]
            }
        },
        methods: {
            toggleLayersMenu: function () {
                this.showLayersMenu = !this.showLayersMenu;
            },
            toggleFillPalette: function () {
                this.showFillPalette = !this.showFillPalette;
            }
        }
    }
</script>
