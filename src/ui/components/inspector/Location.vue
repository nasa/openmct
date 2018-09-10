<template>
<div class="grid-properties">
    <h2 title="The location of this linked object.">Location</h2>
    <ul class="l-inspector-part">
        <li class="grid-row">
            <div class="grid-cell label">This Link</div>
            <div class="grid-cell value">TODO</div>
        </li>
        <li class="grid-row">
            <div class="grid-cell label">Original</div>
            <div class="grid-cell value">TODO</div>
        </li>
    </ul>
</div>
</template>

<script>
export default {
    inject: ['openmct'],
    data() {
        return {
            domainObject: {}
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
            if (selection.length === 0) {
                this.domainObject = {};
                return;
            }
            this.domainObject = selection[0].context.item;
        }
    }
}
</script>
