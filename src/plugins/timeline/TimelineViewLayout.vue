/*****************************************************************************
* Open MCT, Copyright (c) 2014-2020, United States Government
* as represented by the Administrator of the National Aeronautics and Space
* Administration. All rights reserved.
*
* Open MCT is licensed under the Apache License, Version 2.0 (the
* "License"); you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
* http://www.apache.org/licenses/LICENSE-2.0.
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
* WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
* License for the specific language governing permissions and limitations
* under the License.
*
* Open MCT includes source code licensed under additional open source
* licenses. See the Open Source Licenses file (LICENSES.md) included with
* this source code distribution or the Licensing information page available
* at runtime from the About dialog for additional information.
*****************************************************************************/

<template>
<div class="c-timeline">
    <div v-for="timeSystemItem in timeSystems"
         :key="timeSystemItem.timeSystem.key"
         class="c-timeline__object-holder-fixed"
    >
        <div class="c-timeline__object-label">
            {{ timeSystemItem.timeSystem.name }}
        </div>
        <timeline-axis
            class="c-timeline__object"
            :bounds="timeSystemItem.bounds"
            :time-system="timeSystemItem.timeSystem"
            :content-height="height"
            :rendering-engine="'svg'"
        />
    </div>
    <div ref="contentHolder"
         class="c-timeline__objects"
    >
        <div
            v-for="item in items"
            :key="item.keyString"
            class="c-timeline__object-holder"
        >
            <div v-if="item.domainObject.type !== 'plan'"
                 class="c-timeline__object-label"
            >
                <div class="c-object-label__type-icon"
                     :class="item.type.definition.cssClass"
                >
                </div>
                {{ item.domainObject.name }}
            </div>
            <object-view
                class="c-timeline__object"
                :class="{'c-timeline__object-offset': item.domainObject.type !== 'plan'}"
                :default-object="item.domainObject"
                data-selectable
                :options="item.options"
                :object-path="item.objectPath"
            />
        </div>
    <!--    <plan :rendering-engine="'canvas'" />-->
    </div>
</div>
</template>

<script>
import ObjectView from '@/ui/components/ObjectView.vue';
import TimelineAxis from '../../ui/components/TimeSystemAxis.vue';

const unknownObjectType = {
    definition: {
        cssClass: 'icon-object-unknown',
        name: 'Unknown Type'
    }
};

export default {
    inject: ['openmct', 'domainObject', 'composition', 'objectPath'],
    components: {
        ObjectView,
        TimelineAxis
    },
    data() {
        return {
            // plans: [],
            items: [],
            timeSystems: [],
            height: 0
        };
    },
    mounted() {
        if (this.composition) {
            this.composition.on('add', this.addItem);
            this.composition.load();
        }

        this.getTimeSystems();
    },
    methods: {
        addItem(domainObject) {
            let type = this.openmct.types.get(domainObject.type) || unknownObjectType;
            let keyString = this.openmct.objects.makeKeyString(domainObject.identifier);
            let objectPath = [domainObject].concat(this.objectPath.slice());
            let options = {
                compact: true,
                layoutFontSize: '',
                layoutFont: ''
            };
            let item = {
                domainObject,
                objectPath,
                type,
                keyString,
                options
            };

            this.items.push(item);
            this.updateContentHeight();
        },
        updateContentHeight() {
            this.height = Math.round(this.$refs.contentHolder.getBoundingClientRect().height);
        },
        getTimeSystems() {
            const timeSystems = this.openmct.time.getAllTimeSystems();
            timeSystems.forEach(timeSystem => {
                this.timeSystems.push({
                    timeSystem,
                    bounds: this.getBoundsForTimeSystem(timeSystem)
                });
            });
        },
        getBoundsForTimeSystem(timeSystem) {
            const currentBounds = this.openmct.time.bounds();

            //TODO: Some kind of translation via an offset? of current bounds to target timeSystem
            return currentBounds;
        }
    }
};
</script>
