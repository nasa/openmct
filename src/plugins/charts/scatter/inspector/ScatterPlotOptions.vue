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
<ul class="c-tree c-scatter-plot-options">
    <h2 title="Display properties for this object">Scatter Plot</h2>
    <ul>
        <li class="c-tree__item menus-to-left">
            <span class="c-disclosure-triangle is-enabled flex-elem"
                  :class="expandedCssClass"
                  @click="expanded = !expanded"
            >
            </span>

            <div class="c-object-label">
                <div :class="[typeCss]">
                </div>
                <div class="c-object-label__name">{{ name }}</div>
            </div>
        </li>
        <ColorSwatch v-if="expanded"
                     :current-color="currentColor"
                     title="Manually set the color for this plot."
                     edit-title="Manually set the color for this plot"
                     view-title="The color for this plot."
                     short-label="Color"
                     class="grid-properties"
                     @colorSet="setColor"
        />
    </ul>
</ul>
</template>

<script>
import ColorPalette from '@/ui/color/ColorPalette';
import ColorSwatch from '@/ui/color/ColorSwatch.vue';
import Color from "@/ui/color/Color";

export default {
    components: {
        ColorSwatch
    },
    inject: ['openmct', 'domainObject'],
    data() {
        return {
            currentColor: undefined,
            name: this.domainObject.name,
            type: this.domainObject.type,
            expanded: false
        };
    },
    computed: {
        canEdit() {
            return this.isEditing && !this.domainObject.locked;
        },
        expandedCssClass() {
            return this.expanded ? 'c-disclosure-triangle--expanded' : '';
        },
        typeCss() {
            const type = this.openmct.types.get(this.type);
            if (type && type.definition && type.definition.cssClass) {
                return `c-object-label__type-icon ${type.definition.cssClass}`;
            }

            return 'c-object-label__type-icon';
        }
    },
    beforeMount() {
        this.colorPalette = new ColorPalette();
    },
    mounted() {
        this.isEditing = this.openmct.editor.isEditing();
        this.openmct.editor.on('isEditing', this.setEditState);
        this.initColorAndName();
        this.removeStylesListener = this.openmct.objects.observe(this.domainObject, 'configuration.styles', this.initColorAndName);
    },
    beforeDestroy() {
        this.openmct.editor.off('isEditing', this.setEditState);
        if (this.removeStylesListener) {
            this.removeStylesListener();
        }
    },
    methods: {
        setEditState(isEditing) {
            this.isEditing = isEditing;
        },
        initColorAndName() {
        // this is called before the plot is initialized
            if (!this.domainObject.configuration.styles) {
                const color = this.colorPalette.getNextColor().asHexString();
                this.domainObject.configuration.styles = {
                    color
                };
            } else if (!this.domainObject.configuration.styles.color) {
                this.domainObject.configuration.styles.color = this.colorPalette.getNextColor().asHexString();
            }

            this.currentColor = this.domainObject.configuration.styles.color;

            let colorHexString = this.currentColor;
            const colorObject = Color.fromHexString(colorHexString);

            this.colorPalette.remove(colorObject);
        },
        setColor(chosenColor) {
            this.currentColor = chosenColor.asHexString();
            this.openmct.objects.mutate(
                this.domainObject,
                `configuration.styles.color`,
                this.currentColor
            );
        }
    }
};
</script>
