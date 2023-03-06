/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2023, United States Government
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
<div class="c-inspector">
    <object-name />
    <div
        v-if="showStyles"
        class="c-inspector__tabs c-tabs"
    >
        <div
            v-for="tabbedView in tabbedViews"
            :key="tabbedView.key"
            class="c-inspector__tab c-tab"
            :class="{'is-current': isCurrent(tabbedView)}"
            @click="updateCurrentTab(tabbedView)"
        >
            {{ tabbedView.name }}
        </div>
    </div>
    <div class="c-inspector__content">
        <multipane
            v-show="currentTabbedView.key === '__properties'"
            type="vertical"
        >
            <pane class="c-inspector__properties">
                <Properties v-if="!activity" />
                <div
                    v-if="!multiSelect"
                    class="c-inspect-properties c-inspect-properties--location"
                >
                </div>
                <inspector-views />
            </pane>
            <pane
                v-if="isEditing && hasComposition"
                class="c-inspector__elements"
                handle="before"
                label="Elements"
            >
                <plot-elements-pool
                    v-if="isOverlayPlot"
                />
                <elements-pool
                    v-else
                />
            </pane>
        </multipane>
        <multipane
            v-show="currentTabbedView.key === '__styles'"
            type="vertical"
        >
            <pane class="c-inspector__styles">
                <StylesInspectorView />
            </pane>
            <pane
                v-if="isEditing"
                class="c-inspector__saved-styles"
                handle="before"
                label="Saved Styles"
            >
                <SavedStylesInspectorView :is-editing="isEditing" />
            </pane>
        </multipane>
        <multipane
            v-show="currentTabbedView.key === '__annotations'"
            type="vertical"
        >
            <pane class="c-inspector__annotations">
                <AnnotationsInspectorView
                    @annotationCreated="updateCurrentTab(tabbedViews[2])"
                />
            </pane>
        </multipane>
    </div>
</div>
</template>

<script>
import multipane from '../layout/multipane.vue';
import pane from '../layout/pane.vue';
import ElementsPool from './ElementsPool.vue';
import PlotElementsPool from './PlotElementsPool.vue';
import Properties from './details/Properties.vue';
import ObjectName from './ObjectName.vue';
import InspectorViews from './InspectorViews.vue';
import _ from "lodash";
import stylesManager from "@/ui/inspector/styles/StylesManager";
import StylesInspectorView from "@/ui/inspector/styles/StylesInspectorView.vue";
import SavedStylesInspectorView from "@/ui/inspector/styles/SavedStylesInspectorView.vue";
import AnnotationsInspectorView from "./annotations/AnnotationsInspectorView.vue";

const OVERLAY_PLOT_TYPE = "telemetry.plot.overlay";

export default {
    components: {
        StylesInspectorView,
        SavedStylesInspectorView,
        AnnotationsInspectorView,
        multipane,
        pane,
        ElementsPool,
        PlotElementsPool,
        Properties,
        ObjectName,
        InspectorViews
    },
    provide: {
        stylesManager: stylesManager
    },
    inject: ["openmct"],
    props: {
        isEditing: {
            type: Boolean,
            required: true
        }
    },
    data() {
        return {
            hasComposition: false,
            multiSelect: false,
            showStyles: false,
            isOverlayPlot: false,
            tabbedViews: [
                {
                    key: "__properties",
                    name: "Properties"
                },
                {
                    key: "__styles",
                    name: "Styles"
                },
                {
                    key: "__annotations",
                    name: "Annotations"
                }
            ],
            currentTabbedView: {},
            activity: undefined
        };
    },
    mounted() {
        this.excludeObjectTypes = [
            "folder",
            "webPage",
            "conditionSet",
            "summary-widget",
            "hyperlink"
        ];
        this.openmct.selection.on("change", this.updateInspectorViews);
    },
    destroyed() {
        this.openmct.selection.off("change", this.updateInspectorViews);
    },
    methods: {
        updateInspectorViews(selection) {
            this.refreshComposition(selection);

            if (this.openmct.types.get("conditionSet")) {
                this.refreshTabs(selection);
            }

            if (selection.length > 1) {
                this.multiSelect = true;

                // return;
            } else {
                this.multiSelect = false;
            }

            this.setActivity(selection);
        },
        refreshComposition(selection) {
            if (selection.length > 0 && selection[0].length > 0) {
                const parentObject = selection[0][0].context.item;

                this.hasComposition = Boolean(
                    parentObject && this.openmct.composition.get(parentObject)
                );
                this.isOverlayPlot = parentObject?.type === OVERLAY_PLOT_TYPE;
            }
        },
        refreshTabs(selection) {
            if (selection.length > 0 && selection[0].length > 0) {
                //layout items are not domain objects but should allow conditional styles
                this.showStyles = selection[0][0].context.layoutItem;
                let object = selection[0][0].context.item;
                if (object) {
                    let type = this.openmct.types.get(object.type);
                    this.showStyles =
            this.isLayoutObject(selection[0], object.type)
            || this.isCreatableObject(object, type);
                }

                if (
                    !this.currentTabbedView.key
          || (!this.showStyles
            && this.currentTabbedView.key === this.tabbedViews[1].key)
                ) {
                    this.updateCurrentTab(this.tabbedViews[0]);
                }
            }
        },
        isLayoutObject(selection, objectType) {
            //we allow conditionSets to be styled if they're part of a layout
            return (
                selection.length > 1
        && (objectType === "conditionSet"
          || this.excludeObjectTypes.indexOf(objectType) < 0)
            );
        },
        isCreatableObject(object, type) {
            return (
                this.excludeObjectTypes.indexOf(object.type) < 0
        && type.definition.creatable
            );
        },
        updateCurrentTab(view) {
            this.currentTabbedView = view;
        },
        isCurrent(view) {
            return _.isEqual(this.currentTabbedView, view);
        },
        setActivity(selection) {
            this.activity =
        selection
        && selection.length
        && selection[0].length
        && selection[0][0].activity;
        }
    }
};
</script>
