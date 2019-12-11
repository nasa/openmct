<template>
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
</template>

<script>
import multipane from '../layout/multipane.vue';
import pane from '../layout/pane.vue';
import Elements from './Elements.vue';
import Location from './Location.vue';
import Properties from './Properties.vue';
import InspectorViews from './InspectorViews.vue';

export default {
    inject: ['openmct'],
    components: {
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
            hasComposition: false
        }
    },
    mounted() {
        this.openmct.selection.on('change', this.refreshComposition);
        this.refreshComposition(this.openmct.selection.get());
    },
    destroyed() {
        this.openmct.selection.off('change', this.refreshComposition);
    },
    methods: {
        refreshComposition(selection) {
            if (selection.length > 0 && selection[0].length > 0) {
                let parentObject = selection[0][0].context.item;

                this.hasComposition = !!(parentObject && this.openmct.composition.get(parentObject));
            }
        }
    }
}
</script>
