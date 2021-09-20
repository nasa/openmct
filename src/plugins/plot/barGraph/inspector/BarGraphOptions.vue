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
        <div>
            <div class="c-object-label__name">{{ name }}</div>
        </div>
    </li>
    <ColorSwatch v-if="expanded"
                 :current-color="currentColor"
                 title="Manually set the color for this bar graph."
                 edit-title="Manually set the color for this bar graph"
                 view-title="The color for this bar graph."
                 short-label="Color"
                 class="grid-properties"
                 @colorSet="setColor"
    />
</ul>
</template>

<script>
import ColorSwatch from '../../ColorSwatch.vue';

export default {
    components: {
        ColorSwatch
    },
    inject: ['openmct', 'domainObject'],
    props: {
        item: {
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
        }
    },
    watch: {
        item: {
            handler() {
                this.initColor();
            },
            deep: true
        }
    },
    mounted() {
        this.key = this.openmct.objects.makeKeyString(this.item);
        this.initColor();
        this.unObserve = this.openmct.objects.observe(this.domainObject, `this.domainObject.configuration.barStyles[${this.key}]`, this.initColor);
    },
    beforeDestroy() {
        if (this.unObserve) {
            this.unObserve();
        }
    },
    methods: {
        initColor() {
            if (this.domainObject.configuration.barStyles && this.domainObject.configuration.barStyles[this.key]) {
                this.currentColor = this.domainObject.configuration.barStyles[this.key].color;
                this.name = this.domainObject.configuration.barStyles[this.key].name;
            }
        },
        setColor(chosenColor) {
            this.currentColor = chosenColor.asHexString();
            this.openmct.objects.mutate(
                this.domainObject,
                `configuration.barStyles[${this.key}].color`,
                this.currentColor
            );
        }
    }
};
</script>
