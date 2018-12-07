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
                  @endDrag="(item, updates) => $emit('endDrag', item, updates)">
        <div class="u-contents">
            <div class="c-so-view__header">
                <div class="c-so-view__header__start">
                    <div class="c-so-view__name icon-object">{{ domainObject && domainObject.name }}</div>
                    <div class="c-so-view__context-actions c-disclosure-button"></div>
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
            flex: 0 0 auto;
            margin-bottom: $interiorMargin;

            > [class*="__"] {
                display: flex;
                align-items: center;
            }

            > * + * {
                margin-left: $interiorMargin;
            }

            [class*="__start"] {
                flex: 1 1 auto;
                overflow: hidden;
            }

            [class*="__end"] {
                //justify-content: flex-end;
                flex: 0 0 auto;

                [class*="button"] {
                    font-size: 0.7em;
                }
            }
        }

        &__name {
            @include ellipsize();
            flex: 0 1 auto;
            font-size: 1.2em;

            &:before {
                // Object type icon
                flex: 0 0 auto;
                margin-right: $interiorMarginSm;
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
    import LayoutFrame from './LayoutFrame.vue'

    const MINIMUM_FRAME_SIZE = [320, 180],
          DEFAULT_DIMENSIONS = [10, 10],
          DEFAULT_POSITION = [0, 0],
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
            position = position || DEFAULT_POSITION;
            let defaultDimensions = getDefaultDimensions(gridSize);
            let definition = {
                width: defaultDimensions[0],
                height: defaultDimensions[1],
                x: position[0],
                y: position[1],
                identifier: domainObject.identifier,
                hasFrame: hasFrameByDefault(domainObject.type),
                // inspectable: true
            };
            return definition;
        },
        inject: ['openmct'],
        props: {
            item: Object,
            gridSize: Array
        },
        computed: {
        },
        data() {
            return {
                domainObject: undefined
            }
        },
        components: {
            ObjectView,
            LayoutFrame
        },
        mounted() {
            console.log('mounted subobject view!', this);
            this.openmct.objects.get(this.item.identifier)
                .then(domainObject => this.domainObject = domainObject);
        }
    }
</script>
