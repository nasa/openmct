<!--
 Open MCT, Copyright (c) 2014-2020, United States Government
 as represented by the Administrator of the National Aeronautics and Space
 Administration. All rights reserved.

 Open MCT is licensed under the Apache License, Version 2.0 (the
 "License"); you may not use this file except in compliance with the License.
 You may obtain a copy of the License at
 http://www.apache.org/licenses/LICENSE-2.0.

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 License for the specific language governing permissions and limitations
 under the License.

 Open MCT includes source code licensed under additional open source
 licenses. See the Open Source Licenses file (LICENSES.md) included with
 this source code distribution or the Licensing information page available
 at runtime from the About dialog for additional information.
-->
<template>
<div>
    <ul v-if="canEdit"
        class="grid-properties"
    >
        <li class="grid-row">
            <div class="grid-cell label"
                 :title="editTitle"
            >{{ shortLabel }}</div>
            <div class="grid-cell value">
                <div class="c-click-swatch c-click-swatch--menu"
                     @click="toggleSwatch()"
                >
                    <span class="c-color-swatch"
                          :style="{ background: currentColor }"
                    >
                    </span>
                </div>
                <div class="c-palette c-palette--color">
                    <div v-show="swatchActive"
                         class="c-palette__items"
                    >
                        <div v-for="(group, index) in colorPaletteGroups"
                             :key="index"
                             class="u-contents"
                        >
                            <div v-for="(color, colorIndex) in group"
                                 :key="colorIndex"
                                 class="c-palette__item"
                                 :class="{ 'selected': currentColor == color.asHexString() }"
                                 :style="{ background: color.asHexString() }"
                                 @click="setColor(color)"
                            >
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </li>
    </ul>
    <ul v-else
        class="grid-properties"
    >
        <li class="grid-row">
            <div class="grid-cell label"
                 :title="viewTitle"
            >{{ shortLabel }}</div>
            <div class="grid-cell value">
                <span class="c-color-swatch"
                      :style="{
                          'background': currentColor
                      }"
                >
                </span>
            </div>
        </li>
    </ul>
</div>
</template>

<script>
import ColorPalette from './lib/ColorPalette';

export default {
    inject: ['openmct', 'domainObject'],
    props: {
        currentColor: {
            type: String,
            default() {
                return '';
            }
        },
        editTitle: {
            type: String,
            default() {
                return 'Set the color.';
            }
        },
        viewTitle: {
            type: String,
            default() {
                return 'The current color.';
            }
        },
        shortLabel: {
            type: String,
            default() {
                return 'Color';
            }
        }
    },
    data() {
        return {
            swatchActive: false,
            colorPalette: new ColorPalette(),
            isEditing: this.openmct.editor.isEditing()
        };
    },
    computed: {
        canEdit() {
            return this.isEditing && !this.domainObject.locked;
        },
        colorPaletteGroups() {
            return this.colorPalette.groups();
        }
    },
    mounted() {
        this.openmct.editor.on('isEditing', this.setEditState);
    },
    beforeDestroy() {
        this.openmct.editor.off('isEditing', this.setEditState);
    },
    methods: {
        setEditState(isEditing) {
            this.isEditing = isEditing;
        },
        setColor: function (chosenColor) {
            this.$emit('colorSet', chosenColor);
        },
        toggleSwatch() {
            this.swatchActive = !this.swatchActive;
        }
    }
};
</script>
