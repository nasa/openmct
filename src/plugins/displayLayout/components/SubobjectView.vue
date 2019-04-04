/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2018, United States Government
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
    <layout-frame :item="item"
                  :grid-size="gridSize"
                  :title="domainObject.name"
                  @endDrag="(item, updates) => $emit('endDrag', item, updates)">
        <object-frame v-if="domainObject"
                      :domain-object="domainObject"
                      :object-path="objectPath"
                      :has-frame="item.hasFrame"
                      :show-edit-view="false"
                      ref="objectFrame">
        </object-frame>
    </layout-frame>
</template>

<script>
    import ObjectFrame from '../../../ui/components/ObjectFrame.vue'
    import LayoutFrame from './LayoutFrame.vue'

    const MINIMUM_FRAME_SIZE = [320, 180],
          DEFAULT_DIMENSIONS = [10, 10],
          DEFAULT_POSITION = [1, 1],
          DEFAULT_HIDDEN_FRAME_TYPES = ['hyperlink', 'summary-widget'];

    function getDefaultDimensions(gridSize) {
        return MINIMUM_FRAME_SIZE.map((min, index) => {
            return Math.max(
                Math.ceil(min / gridSize[index]),
                DEFAULT_DIMENSIONS[index]
            );
        });
    }

    function hasFrameByDefault(type) {
        return DEFAULT_HIDDEN_FRAME_TYPES.indexOf(type) === -1;
    }

    export default {
        makeDefinition(openmct, gridSize, domainObject, position) {
            let defaultDimensions = getDefaultDimensions(gridSize);
            position = position || DEFAULT_POSITION;

            return {
                width: defaultDimensions[0],
                height: defaultDimensions[1],
                x: position[0],
                y: position[1],
                identifier: domainObject.identifier,
                hasFrame: hasFrameByDefault(domainObject.type),
                useGrid: true
            };
        },
        inject: ['openmct'],
        props: {
            item: Object,
            gridSize: Array,
            initSelect: Boolean,
            index: Number
        },
        data() {
            return {
                domainObject: undefined,
                objectPath: []
            }
        },
        components: {
            ObjectFrame,
            LayoutFrame
        },
        watch: {
            index(newIndex) {
                if (!this.context) {
                    return;
                }

                this.context.index = newIndex;
            }
        },
        methods: {
            setObject(domainObject) {
                this.domainObject = domainObject;
                this.objectPath = [this.domainObject].concat(this.openmct.router.path);
                this.$nextTick(function () {
                    let childContext = this.$refs.objectFrame.getSelectionContext();
                    childContext.item = domainObject;
                    childContext.layoutItem = this.item;
                    childContext.index = this.index;
                    this.context = childContext;
                    this.removeSelectable = this.openmct.selection.selectable(
                        this.$el, this.context, this.initSelect);
                });
            }
        },
        mounted() {
            this.openmct.objects.get(this.item.identifier)
                .then(this.setObject);
        },
        destroyed() {
            if (this.removeSelectable) {
                this.removeSelectable();
            }
        }
    }
</script>
