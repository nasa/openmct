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
<ul>
    <li class="c-tree__item menus-to-left">
        <span class="c-disclosure-triangle is-enabled flex-elem"
              :class="expandedCssClass"
              @click="expanded = !expanded"
        >
        </span>
        <div :class="objectLabelCss">
            <div class="c-object-label__type-icon"
                 :class="[seriesCss]"
            >
                <span class="is-status__indicator"
                      title="This item is missing or suspect"
                ></span>
            </div>
            <div class="c-object-label__name">{{ name }}</div>
        </div>
    </li>
    <ColorSwatch v-if="expanded"
                 :current-color="currentColor"
                 title="Manually set the color for this bar graph series."
                 edit-title="Manually set the color for this bar graph series"
                 view-title="The color for this bar graph series."
                 short-label="Color"
                 class="grid-properties"
                 @colorSet="setColor"
    />
</ul>
</template>

<script>
import ColorSwatch from '@/ui/color/ColorSwatch.vue';
import Color from "@/ui/color/Color";

export default {
    components: {
        ColorSwatch
    },
    inject: ['openmct', 'domainObject'],
    props: {
        item: {
            type: Object,
            required: true
        },
        colorPalette: {
            type: Object,
            required: true
        }
    },
    data() {
        return {
            currentColor: undefined,
            name: '',
            expanded: false
        };
    },
    computed: {
        expandedCssClass() {
            return this.expanded ? 'c-disclosure-triangle--expanded' : '';
        },
        seriesCss() {
            let type = this.openmct.types.get(this.domainObject.type);

            return type.definition.cssClass ? `c-object-label__type-icon ${type.definition.cssClass}` : `c-object-label__type-icon`;
        },
        objectLabelCss() {
            return this.status ? `c-object-label is-status--${this.status}'` : 'c-object-label';
        }
    },
    watch: {
        item: {
            handler() {
                this.initColorAndName();
            },
            deep: true
        }
    },
    mounted() {
        this.key = this.openmct.objects.makeKeyString(this.item);
        this.initColorAndName();
        this.removeBarStylesListener = this.openmct.objects.observe(this.domainObject, `this.domainObject.configuration.barStyles.series[${this.key}]`, this.initColorAndName);
        this.status = this.openmct.status.get(this.domainObject.identifier);
        this.removeStatusListener = this.openmct.status.observe(this.domainObject.identifier, this.setStatus);
    },
    beforeDestroy() {
        if (this.removeStatusListener) {
            this.removeStatusListener();
        }

        if (this.removeBarStylesListener) {
            this.removeBarStylesListener();
        }
    },
    methods: {
        initColorAndName() {
            // this is called before the plot is initialized
            if (!this.domainObject.configuration.barStyles.series[this.key]) {
                const color = this.colorPalette.getNextColor().asHexString();
                this.domainObject.configuration.barStyles.series[this.key] = {
                    color,
                    name: ''
                };
            }

            this.currentColor = this.domainObject.configuration.barStyles.series[this.key].color;
            this.name = this.domainObject.configuration.barStyles.series[this.key].name;

            let colorHexString = this.domainObject.configuration.barStyles.series[this.key].color;
            const colorObject = Color.fromHexString(colorHexString);

            this.colorPalette.remove(colorObject);
        },
        setColor(chosenColor) {
            this.currentColor = chosenColor.asHexString();
            this.openmct.objects.mutate(
                this.domainObject,
                `configuration.barStyles.series[${this.key}].color`,
                this.currentColor
            );
        }
    }
};
</script>
