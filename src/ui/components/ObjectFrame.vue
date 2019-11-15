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
<div
    class="c-so-view has-local-controls"
    :class="{
        'c-so-view--no-frame': !hasFrame,
        'has-complex-content': complexContent
    }"
>
    <div class="c-so-view__header">
        <div
            class="c-so-view__header__icon"
            :class="cssClass"
        />
        <div class="c-so-view__header__name">
            {{ domainObject && domainObject.name }}
        </div>
        <context-menu-drop-down
            :object-path="objectPath"
        />
    </div>
    <div class="c-so-view__local-controls c-so-view__view-large h-local-controls c-local-controls--show-on-hover">
        <button
            class="c-button icon-expand"
            title="View Large"
            @click="expand"
        />
    </div>
    <object-view
        ref="objectView"
        class="c-so-view__object-view"
        :object="domainObject"
        :show-edit-view="showEditView"
        :object-path="objectPath"
    />
</div>
</template>

<style lang="scss">
    @import "~styles/sass-base";

    .c-so-view {
        display: flex;
        flex-direction: column;

        /*************************** HEADER */
        &__header {
            flex: 0 0 auto;
            display: flex;
            align-items: center;
            margin-bottom: $interiorMargin;

            &__icon {
                flex: 0 0 auto;
                margin-right: $interiorMarginSm;
                opacity: 0.5;
            }

            &__name {
                @include headerFont(1em);
                @include ellipsize();
                flex: 0 1 auto;
            }
        }

        &:not(.c-so-view--no-frame) {
            background: $colorBodyBg;
            border: $browseFrameBorder;
            padding: $interiorMargin;
        }

        &--no-frame {
            > .c-so-view__header {
                display: none;
            }

            > .c-so-view__local-controls {
                top: $interiorMarginSm; right: $interiorMarginSm;
            }
        }

        &__local-controls {
            position: absolute;
            top: $interiorMargin; right: $interiorMargin;
            z-index: 2;
        }

        &__view-large {
            display: none;
        }

        &.has-complex-content {
            > .c-so-view__view-large { display: block; }
        }

        /*************************** OBJECT VIEW */
        &__object-view {
            flex: 1 1 auto;
            height: 0; // Chrome 73 overflow bug fix
            overflow: auto;

            .c-object-view {
                .u-fills-container {
                    // Expand component types that fill a container
                    @include abs();
                }
            }
        }

        .c-click-icon,
        .c-button {
            // Shrink buttons a bit when they appear in a frame
            font-size: 0.85em;
            padding: 3px 5px;
        }
    }
</style>

<script>
import ObjectView from './ObjectView.vue'
import ContextMenuDropDown from './contextMenuDropDown.vue';

const SIMPLE_CONTENT_TYPES = [
    'clock',
    'timer',
    'summary-widget',
    'hyperlink'
];

export default {
    inject: ['openmct'],
    components: {
        ObjectView,
        ContextMenuDropDown
    },
    props: {
        domainObject: Object,
        objectPath: Array,
        hasFrame: Boolean,
        showEditView: {
            type: Boolean,
            default: () => true
        }
    },
    data() {
        let objectType = this.openmct.types.get(this.domainObject.type),
            cssClass = objectType && objectType.definition ? objectType.definition.cssClass : 'icon-object-unknown',
            complexContent = !SIMPLE_CONTENT_TYPES.includes(this.domainObject.type);

        return {
            cssClass,
            complexContent
        }
    },
    methods: {
        expand() {
            let objectView = this.$refs.objectView,
                parentElement = objectView.$el,
                childElement = parentElement.children[0];

            this.openmct.overlays.overlay({
                element: childElement,
                size: 'large',
                onDestroy() {
                    parentElement.append(childElement);
                }
            });
        },
        getSelectionContext() {
            return this.$refs.objectView.getSelectionContext();
        }
    }
}
</script>
