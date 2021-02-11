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
<div ref="timelineHolder"
     class="c-timeline-holder"
>
    <div class="c-timeline">
        <div v-for="timeSystemItem in timeSystems"
             :key="timeSystemItem.timeSystem.key"
             class="u-contents"
        >
            <div class="c-timeline__lane-label"
                 :class="{'c-timeline__lane-label--span-cols': true}"
            >
                {{ timeSystemItem.timeSystem.name }}
            </div>
            <timeline-axis
                class="c-timeline__lane-object"
                :bounds="timeSystemItem.bounds"
                :time-system="timeSystemItem.timeSystem"
                :content-height="height"
                :rendering-engine="'svg'"
            />
        </div>

        <div ref="contentHolder"
             class="u-contents c-timeline__objects c-timeline__content-holder"
        >
            <div
                v-for="item in items"
                :key="item.keyString"
                class="u-contents c-timeline__content"
            >
                <div v-if="item.domainObject.type !== 'plan'"
                     class="c-timeline__lane-label c-timeline__lane-label--span-cols c-object-label"
                >
                    <div class="c-object-label__type-icon"
                         :class="item.type.definition.cssClass"
                    >
                    </div>
                    <div class="c-object-label__name">
                        {{ item.domainObject.name }}
                    </div>
                </div>
                <object-view
                    class="c-timeline__lane-object c-timeline__lane-object--domain-object"
                    :class="{'u-contents': item.domainObject.type === 'plan'}"
                    :style="{'min-height': item.height}"
                    :default-object="item.domainObject"
                    data-selectable
                    :options="item.options"
                    :object-path="item.objectPath"
                />
            </div>
            <!--    <plan :rendering-engine="'canvas'" />-->
        </div>
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

function getViewKey(domainObject, openmct) {
    let viewKey = '';
    const plotView = openmct.objectViews.get(domainObject).find((view) => {
        return view.key.startsWith('plot-') && view.key !== 'plot-single';
    });
    if (plotView) {
        viewKey = plotView.key;
    }

    return viewKey;
}

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
    beforeDestroy() {
        this.composition.off('add', this.addItem);
        this.composition.off('remove', this.removeItem);
        this.composition.off('reorder', this.reorder);
    },
    mounted() {
        if (this.composition) {
            this.composition.on('add', this.addItem);
            this.composition.on('remove', this.removeItem);
            this.composition.on('reorder', this.reorder);
            this.composition.load();
        }

        this.getTimeSystems();
    },
    methods: {
        addItem(domainObject) {
            let type = this.openmct.types.get(domainObject.type) || unknownObjectType;
            let keyString = this.openmct.objects.makeKeyString(domainObject.identifier);
            let objectPath = [domainObject].concat(this.objectPath.slice());
            let viewKey = getViewKey(domainObject, this.openmct);

            let options = {
                compact: true,
                layoutFontSize: '',
                layoutFont: '',
                clientWidth: Math.round(this.$refs.timelineHolder.getBoundingClientRect().width),
                viewKey
            };
            let height = domainObject.type === 'telemetry.plot.stacked' ? `${domainObject.composition.length * 100}px` : '100px';
            let item = {
                domainObject,
                objectPath,
                type,
                keyString,
                options,
                height
            };

            this.items.push(item);
            this.updateContentHeight();
        },
        removeItem(identifier) {
            let index = this.items.findIndex(item => this.openmct.objects.areIdsEqual(identifier, item.domainObject.identifier));
            this.items.splice(index, 1);
        },
        reorder(reorderPlan) {
            let oldItems = this.items.slice();
            reorderPlan.forEach((reorderEvent) => {
                this.$set(this.items, reorderEvent.newIndex, oldItems[reorderEvent.oldIndex]);
            });
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
