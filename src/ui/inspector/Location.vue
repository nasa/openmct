<template>
<div class="c-properties c-properties--location">
    <div class="c-properties__header" title="The location of this linked object.">Location</div>
    <ul class="c-properties__section" v-if='!multiSelect'>
        <li class="c-properties__row">
            <div class="c-properties__label">This Link</div>
            <div class="c-properties__value">TODO</div>
        </li>
        <li class="c-properties__row">
            <div class="c-properties__label">Original</div>
            <div class="c-properties__value">TODO</div>
        </li>
    </ul>
    <div class="c-properties__row--span-all" v-if="multiSelect">No location to display for multiple items</div>
</div>
</template>

<script>
export default {
    inject: ['openmct'],
    data() {
        return {
            domainObject: {},
            multiSelect: false
        }
    },
    mounted() {
        this.openmct.selection.on('change', this.updateSelection);
        this.updateSelection(this.openmct.selection.get());
    },
    beforeDestroy() {
        this.openmct.selection.off('change', this.updateSelection);
    },
    methods: {
        updateSelection(selection) {
            if (selection.length === 0 || selection[0].length === 0) {
                this.domainObject = {};
                return;
            }

            if (selection.length > 1) {
                this.multiSelect = true;
                return;
            } else {
                this.multiSelect = false;
                this.domainObject = selection[0][0].context.item;
            }
        }
    }
}
</script>
