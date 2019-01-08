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
    <div class="u-contents c-so-view has-local-controls"
        :class="{
            'c-so-view--no-frame': !hasFrame
        }">
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
        }

        &--no-frame .c-so-view__header {
            display: none;
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
    import ObjectView from './ObjectView.vue'
    import ContextMenuDropDown from './contextMenuDropDown.vue';

    export default {
        inject: ['openmct'],
        props: {
            domainObject: Object,
            objectPath: Array,
            hasFrame: Boolean,
        },
        computed: {
            cssClass() {
                if (!this.domainObject || !this.domainObject.type) {
                    return;
                }
                let objectType = this.openmct.types.get(this.domainObject.type);
                if (!objectType || !objectType.definition) {
                    return; // TODO: return unknown icon type.
                }
                return objectType.definition.cssClass;
            }
        },
        components: {
            ObjectView,
            ContextMenuDropDown,
        }
    }
</script>
