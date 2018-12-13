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
                  @endDrag="(item, updates) => $emit('endDrag', item, updates)"
                  @drilledIn="item => $emit('drilledIn', item)">
        <div class="u-contents">
            <div class="c-so-view__header">
                <div class="c-so-view__header__start">
                    <div class="c-so-view__header__name"
                         :class="cssClass">
                        {{ domainObject && domainObject.name }}
                    </div>
                    <context-menu-drop-down
                        :object-path="objectPath">
                    </context-menu-drop-down>
                </div>
                <div class="c-so-view__header__end">
                    <div class="c-button icon-expand local-controls--hidden"></div>
                </div>
            </div>
            <object-view class="c-so-view__object-view"
                         :object="domainObject"></object-view>
        </div>
    </layout-frame>
</template>

<style lang="scss">
    @import "~styles/sass-base";

    .c-so-view {
        /*************************** HEADER */
        &__header {
            display: flex;
            align-items: center;

            &__start,
            &__end {
                display: flex;
                flex: 1 1 auto;
            }

            &__end {
                justify-content: flex-end;
            }

            &__name {
                @include headerFont(1em);
                display: flex;
                &:before {
                    margin-right: $interiorMarginSm;
                }
            }

            .no-frame & {
                display: none;
            }
        }

        &__name {
            @include ellipsize();
            @include headerFont(1.2em);
            flex: 0 1 auto;

            &:before {
                // Object type icon
                flex: 0 0 auto;
                margin-right: $interiorMarginSm;
                opacity: 0.5;
            }
        }

        /*************************** OBJECT VIEW */
        &__object-view {
            flex: 1 1 auto;
            overflow: auto;

            .c-object-view {
                .u-fills-container {
                    // Expand component types that fill a container
                    @include abs();
                }
            }
        }
    }
</style>

<script>
    import ObjectView from '../../../ui/components/layout/ObjectView.vue'
    import ContextMenuDropDown from '../../../ui/components/controls/contextMenuDropDown.vue';
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
                hasFrame: hasFrameByDefault(domainObject.type)
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
                cssClass: undefined,
                objectPath: []
            }
        },
        components: {
            ObjectView,
            ContextMenuDropDown,
            LayoutFrame
        },
        methods: {
            setObject(domainObject) {
                this.domainObject = domainObject;
                this.objectPath = [this.domainObject].concat(this.openmct.router.path);
                this.cssClass = this.openmct.types.get(this.domainObject.type).definition.cssClass;
                let context = {
                    item: domainObject,
                    layoutItem: this.item,
                    index: this.index
                };
                this.removeSelectable = this.openmct.selection.selectable(
                    this.$el, context, this.initSelect);
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
