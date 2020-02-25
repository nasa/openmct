<template>
<div class="c-inspector">
    <div class="c-inspector__tabs"
    >
        <div v-if="showStyles"
             class="c-inspector__tabs__holder">
            <div v-for="tabbedView in tabbedViews"
                 :key="tabbedView.key"
                 class="c-inspector__tabs__header"
                 @click="updateCurrentTab(tabbedView)"
            >
                <span class="c-inspector__tabs__label c-tab"
                      :class="{'is-current': isCurrent(tabbedView)}"
                >{{ tabbedView.name }}</span>
            </div>
        </div>
        <div class="c-inspector__tabs__contents">
            <multipane v-if="currentTabbedView.key === '__properties'"
                       class="c-inspector"
                       type="vertical"
            >
                <pane class="c-inspector__properties">
                    <properties />
                    <location />
                    <inspector-views/>
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
            <pane v-else
                  class="c-inspector__styles"
            >
                <styles-inspector-view/>
            </pane>
        </div>
    </div>
</div>
</template>

<script>
import multipane from '../layout/multipane.vue';
import pane from '../layout/pane.vue';
import Elements from './Elements.vue';
import Location from './Location.vue';
import Properties from './Properties.vue';
import InspectorViews from './InspectorViews.vue';
import _ from "lodash";
import StylesInspectorView from "./StylesInspectorView.vue";

export default {
    inject: ['openmct'],
    components: {
        StylesInspectorView,
        // StylesInspectorView,
        multipane,
        pane,
        Elements,
        Properties,
        Location,
        InspectorViews
    },
    props: {
        'isEditing': Boolean
    },
    data() {
        return {
            hasComposition: false,
            showStyles: false,
            tabbedViews: [{
                key: '__properties',
                name: 'Properties'
            },{
                key: '__styles',
                name: 'Styles'
            }],
            currentTabbedView: {}
        }
    },
    mounted() {
        this.excludeObjectTypes = ['folder', 'webPage', 'conditionSet'];
        this.openmct.selection.on('change', this.updateInspectorViews);
    },
    destroyed() {
        this.openmct.selection.off('change', this.updateInspectorViews);
    },
    methods: {
        updateInspectorViews(selection) {
            this.refreshComposition(selection);
            if (this.openmct.types.get('conditionSet')) {
                this.refreshTabs(selection);
            }
        },
        refreshComposition(selection) {
            if (selection.length > 0 && selection[0].length > 0) {
                let parentObject = selection[0][0].context.item;

                this.hasComposition = !!(parentObject && this.openmct.composition.get(parentObject));
            }
        },
        refreshTabs(selection) {
            if (selection.length > 0 && selection[0].length > 0) {
                //layout items are not domain objects but should allow conditional styles
                this.showStyles = selection[0][0].context.layoutItem;
                let object = selection[0][0].context.item;
                if (object) {
                    let type = this.openmct.types.get(object.type);
                    this.showStyles = (this.excludeObjectTypes.indexOf(object.type) < 0) && type.definition.creatable;
                }
                this.updateCurrentTab(this.tabbedViews[0]);
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
