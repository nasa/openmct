<template>
    <div class="c-toolbar">
        <!-- VERSION MANUALLY RESTORED FROM VUE-LAYOUT -->
        <div class="c-button-set">
            <div class="c-ctrl-wrapper">
                <div class="c-button--menu js-add-button icon-plus"
                    @click="toggleMenus">
                    <div class="c-button__label">Add</div>
                </div>
                <div class="c-menu" v-if="showMenus">
                    <ul>
                        <li v-for="item in addMenuItems"
                            :class="item.class"
                            :title="item.title">
                            {{ item.name }}
                        </li>
                    </ul>
                </div>
            </div>
        </div>

        <div class="c-button-set"
             v-if="toolsItemSelected">
            <div class="c-ctrl-wrapper"
                 v-if="toolsItemSelected">
                <div class="c-click-icon c-click-icon--menu js-layers icon-layers"
                     @click="toggleMenus"></div>
                <div class="c-menu" v-if="showMenus">
                    <ul>
                        <li v-for="item in layersMenuItems"
                            :class="item.class"
                            :title="item.title">
                            {{ item.name }}
                        </li>
                    </ul>
                </div>
            </div>

            <div class="c-ctrl-wrapper"
                 v-if="toolsColorFill">
                <div class="c-click-icon c-click-icon--swatched js-color-fill icon-paint-bucket"
                     @click="toggleMenus">
                    <div class="c-swatch" style="background: #33ff00;"></div>
                </div>
                <div class="c-menu c-palette c-palette--color"
                    v-if="showMenus">
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
                            @click="this.setColor(color.value)"></div>
                    </div>
                </div>
            </div>

            <div class="c-ctrl-wrapper"
                 v-if="toolsColorStroke">
                <div class="c-click-icon c-click-icon--swatched js-color-stroke icon-pencil">
                    <div class="c-toolbar-button__swatch" style="background: #ffffff;"></div>
                </div>
            </div>

            <div class="c-ctrl-wrapper"
                 v-if="toolsColorText">
                <div class="c-click-icon c-click-icon--swatched js-color-text icon-font">
                    <div class="c-toolbar-button__swatch" style="background: #333333;"></div>
                </div>
            </div>

        </div>

        <div class="c-button-set"
             v-if="toolsItemSelected && toolsFontSize">
            <div class="c-ctrl-wrapper">
                <div class="c-click-icon c-click-icon--menu js-font-size"
                     @click="toggleMenus">
                    <div class="c-button__label">11 px</div>
                </div>
                <div class="c-menu" v-if="showMenus">
                    <ul>
                        <li v-for="item in fontSizeMenuItems">
                            {{ item.name }}
                        </li>
                    </ul>
                </div>
            </div>
        </div>

        <div class="c-button-set"
             v-if="toolsItemSelected && toolsEditProperties">
            <div class="c-ctrl-wrapper">
                <div class="c-click-icon js-image icon-gear"></div>
            </div>
        </div>

        <div class="c-button-set"
             v-if="toolsItemSelected">
            <labeledNumberInput label="X" value=1 title="X position"></labeledNumberInput>
            <labeledNumberInput label="Y" value=2 title="Y position"></labeledNumberInput>
            <labeledNumberInput label="W" value=3 title="Width"></labeledNumberInput>
            <labeledNumberInput label="H" value=4 title="Height"></labeledNumberInput>
        </div>

        <div class="c-button-set"
             v-if="toolsItemSelected">
            <div class="c-click-icon c-click-icon--caution icon-trash"></div>
        </div>

        <div class="c-button-set"
             v-if="toolsItemSelected">
            <checkbox checked title="This is a checkbox">Checkbox</checkbox>
        </div>

        <div class="c-button-set"
             v-if="toolsItemSelected">
            <toggle-button title="Toggle frame" checked
                           class="c-click-icon"
                           inner-class-on="icon-frame-show"
                           inner-class-off="icon-frame-hide"></toggle-button>
            <toggle-button title="Snap to grid" checked
                    class="c-click-icon"
                    inner-class-on="icon-grid-snap-to"
                    inner-class-off="icon-grid-snap-no"></toggle-button>
            <toggle-button title="Show label and value" checked
                    class="c-click-icon"
                    inner-class-on="icon-two-parts-both"
                    inner-class-off="icon-two-parts-one-only"></toggle-button>
        </div>
    </div>
</template>

<script>
    import labeledNumberInput from '../controls/labeledNumberInput.vue';
    import checkbox from '../controls/checkboxCustom.vue';
    import toggleButton from '../controls/toggleButton.vue';

    export default {
        components: {
            labeledNumberInput,
            checkbox,
            toggleButton
        },
        methods: {
            toggleMenus: function () {
                this.showMenus = !this.showMenus;
            }
        },
        props: {
            toolsItemSelected: { type: Boolean,  default: true },
            toolsColorFill: { type: Boolean,  default: true },
            toolsColorStroke: { type: Boolean,  default: true },
            toolsColorText: { type: Boolean,  default: true },
            toolsFontSize: { type: Boolean,  default: true },
            toolsEditProperties: { type: Boolean,  default: true },
            toolSetBox: ['toolsColorFill', 'toolsColorStroke'],
            toolSetLine: ['toolsColorStroke'],
            toolSetText: ['toolsColorFill', 'toolsColorStroke', 'toolsColorText', 'toolsFontSize', 'toolsEditProperties'],
            toolSetImage: ['toolsColorStroke', 'toolsEditProperties'],
            toolSetTelemetry: ['toolsColorFill', 'toolsColorStroke', 'toolsColorText', 'toolsFontSize', 'toolsLabelValue']
        },
        data: function () {
            return {
                showMenus: false,
                addMenuItems: [
                    { name: 'Box', class: 'icon-box', title: 'Add Box' },
                    { name: 'Line', class: 'icon-line-horz', title: 'Add Line' },
                    { name: 'Text', class: 'icon-font', title: 'Add Text' },
                    { name: 'Image', class: 'icon-image', title: 'Add Image' }
                ],
                layersMenuItems: [
                    { name: 'Move to top', class: 'icon-arrow-double-up', title: 'Move to top' },
                    { name: 'Move up', class: 'icon-arrow-up', title: 'Move up' },
                    { name: 'Move down', class: 'icon-arrow-down', title: 'Move down' },
                    { name: 'Move to bottom', class: 'icon-arrow-double-down', title: 'Move to bottom' }
                ],
                fontSizeMenuItems: [
                    { value: '9', name: '9 px' },
                    { value: '10', name: '10 px' },
                    { value: '11', name: '11 px' },
                    { value: '12', name: '12 px' },
                    { value: '13', name: '13 px' },
                    { value: '14', name: '14 px' },
                    { value: '16', name: '16 px' },
                    { value: '18', name: '18 px' },
                    { value: '20', name: '20 px' },
                    { value: '24', name: '24 px' },
                    { value: '28', name: '28 px' },
                    { value: '32', name: '32 px' },
                    { value: '40', name: '40 px' },
                    { value: '48', name: '48 px' },
                    { value: '56', name: '56 px' },
                    { value: '64', name: '64 px' },
                    { value: '72', name: '72 px' },
                    { value: '80', name: '80 px' },
                    { value: '88', name: '88 px' },
                    { value: '96', name: '96 px' },
                    { value: '128', name: '128 px' },
                    { value: '160', name: '160 px' }
                ],
                colorPalette: [
                    { value: '#000000' },
                    { value: '#434343' },
                    { value: '#666666' },
                    { value: '#999999' },
                    { value: '#b7b7b7' },
                    { value: '#cccccc' },
                    { value: '#d9d9d9' },
                    { value: '#efefef' },
                    { value: '#f3f3f3' },
                    { value: '#ffffff' },
                    { value: '#980000' },
                    { value: '#ff0000' },
                    { value: '#ff9900' },
                    { value: '#ffff00' },
                    { value: '#00ff00' },
                    { value: '#00ffff' },
                    { value: '#4a86e8' },
                    { value: '#0000ff' },
                    { value: '#9900ff' },
                    { value: '#ff00ff' },
                    { value: '#e6b8af' },
                    { value: '#f4cccc' },
                    { value: '#fce5cd' },
                    { value: '#fff2cc' },
                    { value: '#d9ead3' },
                    { value: '#d0e0e3' },
                    { value: '#c9daf8' },
                    { value: '#cfe2f3' },
                    { value: '#d9d2e9' },
                    { value: '#ead1dc' },
                    { value: '#dd7e6b' },
                    { value: '#dd7e6b' },
                    { value: '#f9cb9c' },
                    { value: '#ffe599' },
                    { value: '#b6d7a8' },
                    { value: '#a2c4c9' },
                    { value: '#a4c2f4' },
                    { value: '#9fc5e8' },
                    { value: '#b4a7d6' },
                    { value: '#d5a6bd' },
                    { value: '#cc4125' },
                    { value: '#e06666' },
                    { value: '#f6b26b' },
                    { value: '#ffd966' },
                    { value: '#93c47d' },
                    { value: '#76a5af' },
                    { value: '#6d9eeb' },
                    { value: '#6fa8dc' },
                    { value: '#8e7cc3' },
                    { value: '#c27ba0' },
                    { value: '#a61c00' },
                    { value: '#cc0000' },
                    { value: '#e69138' },
                    { value: '#f1c232' },
                    { value: '#6aa84f' },
                    { value: '#45818e' },
                    { value: '#3c78d8' },
                    { value: '#3d85c6' },
                    { value: '#674ea7' },
                    { value: '#a64d79' },
                    { value: '#85200c' },
                    { value: '#990000' },
                    { value: '#b45f06' },
                    { value: '#bf9000' },
                    { value: '#38761d' },
                    { value: '#134f5c' },
                    { value: '#1155cc' },
                    { value: '#0b5394' },
                    { value: '#351c75' },
                    { value: '#741b47' },
                    { value: '#5b0f00' },
                    { value: '#660000' },
                    { value: '#783f04' },
                    { value: '#7f6000' },
                    { value: '#274e13' },
                    { value: '#0c343d' },
                    { value: '#1c4587' },
                    { value: '#073763' },
                    { value: '#20124d' },
                    { value: '#4c1130' }
                ]
            }
        }
    }
</script>
