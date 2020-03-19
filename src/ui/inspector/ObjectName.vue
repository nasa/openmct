<template>
    <div class="c-inspector__header">
        <div class="c-inspector__selected-w"
             v-if="!multiSelect && !singleSelectNonObject"
             :class="typeCssClass"
        >
            <span class="c-inspector__selected">{{ item.name }}</span>
        </div>
        <div class="c-inspector__selected-w"
             v-if="singleSelectNonObject"
             :class="typeCssClass"
        >
            <span class="c-inspector__selected c-inspector__selected--non-domain-object">Layout Object</span>
        </div>
        <div class="c-inspector__multiple-selected-w"
             v-if="multiSelect"
        >
            {{ itemsSelected }} items selected
        </div>
    </div>
</template>

<script>
    export default {
        inject: ['openmct'],
        data() {
            return {
                domainObject: {},
                multiSelect: false,
                itemsSelected: 0
            }
        },
        computed: {
            item() {
                return this.domainObject || {};
            },
            type() {
                return this.openmct.types.get(this.item.type);
            },
            typeCssClass() {
                if (this.type.definition.cssClass === undefined) {
                    return 'icon-object';
                }
                return this.type.definition.cssClass;
            },
            singleSelectNonObject() {
                return !this.item.identifier && !this.multiSelect;
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
                    this.domainObject = {};
                    this.itemsSelected = selection.length;
                    return;
                } else {
                    this.multiSelect = false;
                    this.domainObject = selection[0][0].context.item;
                }
            }
        }
    }
</script>
