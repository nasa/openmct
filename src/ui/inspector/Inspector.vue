<template>
<div class="c_inspector">
    <div v-if="hasTabs"
         class="c-inspector__tabs"
    >
        <div class="c-inspector__tabs__holder">
            <div v-for="tabbedView in tabbedViews"
                 :key="tabbedView.key"
                 class="c-inspector__tabs__header"
                 @click="updateCurrentTab(tabbedView)"
            >
                <span class="c-inspector__tabs__label c-tab"
                      :class="{'is-current': isCurrent(tabbedView)}"
                >{{ tabbedView.getName() }}</span>
            </div>
        </div>
        <div v-if="currentTabbedView.key !== '__properties'"
             class="c-inspector__tabs__contents"
        >
            <tabbed-inspector-view :view="currentTabbedView" />
        </div>
        <div v-else
             class="c-inspector__tabs__contents"
        >
            <multipane
                class="c-inspector"
                type="vertical"
            >
                <pane class="c-inspector__properties">
                    <properties />
                    <location />
                    <inspector-views />
                </pane>
                <pane
                    v-if="isEditing && hasComposition"
                    class="c-inspector__elements"
                    handle="before"
                    label="Elements"
                >
                    <elements />
                </pane>
            </multipane>
        </div>
    </div>
    <multipane v-else
               class="c-inspector"
               type="vertical"
    >
        <pane class="c-inspector__properties">
            <properties />
            <location />
            <inspector-views />
        </pane>
        <pane
            v-if="isEditing && hasComposition"
            class="c-inspector__elements"
            handle="before"
            label="Elements"
        >
            <elements />
        </pane>
    </multipane>
</div>
</template>

<script>
import multipane from '../layout/multipane.vue';
import pane from '../layout/pane.vue';
import Elements from './Elements.vue';
import Location from './Location.vue';
import Properties from './Properties.vue';
import InspectorViews from './InspectorViews.vue';
import TabbedInspectorView from './TabbedInspectorView.vue';
import _ from "lodash";

export default {
    inject: ['openmct'],
    components: {
        multipane,
        pane,
        Elements,
        Properties,
        Location,
        InspectorViews,
        TabbedInspectorView
    },
    props: {
        'isEditing': Boolean
    },
    data() {
        return {
            hasComposition: false,
            hasTabs: false,
            tabbedViews: [],
            currentTabbedView: {},
            PROPERTY_VIEW: {
                key: '__properties',
                getName: () => { return 'Properties';}
            }
        }
    },
    mounted() {
        this.openmct.selection.on('change', this.updateInspectorViews);
    },
    destroyed() {
        this.openmct.selection.off('change', this.updateInspectorViews);
    },
    methods: {
        updateInspectorViews(selection) {
            this.refreshComposition(selection);
            this.refreshTabs(selection);
        },
        refreshComposition(selection) {
            if (selection.length > 0 && selection[0].length > 0) {
                let parentObject = selection[0][0].context.item;

                this.hasComposition = !!(parentObject && this.openmct.composition.get(parentObject));
            }
        },
        refreshTabs(selection) {
            if (selection.length > 0 && selection[0].length > 0) {
                let selectedViews = this.openmct.propertiesInspector.get(selection);
                this.tabbedViews = selectedViews.filter(selectedView => {
                    return typeof selectedView.tabbed === 'function' && selectedView.tabbed();
                });
                this.hasTabs = this.tabbedViews.length;
                if (this.hasTabs) {
                    this.tabbedViews.unshift(this.PROPERTY_VIEW);
                    this.updateCurrentTab(this.tabbedViews[0]);
                }
            }
        },
        updateCurrentTab(view) {
            this.currentTabbedView = view;
        },
        isCurrent(view) {
            return _.isEqual(this.currentTabbedView, view)
        }
    }
}
</script>
