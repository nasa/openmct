<template>
<div class="c-inspector__header">
    <div v-if="!multiSelect"
         class="c-inspector__selected c-object-label"
         :class="[statusClass]"
    >
        <div class="c-object-label__type-icon"
             :class="typeCssClass"
        >
            <span class="is-status__indicator"
                  title="This item is missing or suspect"
            ></span>
        </div>
        <span v-if="!singleSelectNonObject"
              class="c-inspector__selected c-object-label__name"
        >{{ item.name }}</span>
        <div v-if="singleSelectNonObject"
             class="c-inspector__selected c-inspector__selected--non-domain-object  c-object-label"
        >
            <span class="c-object-label__type-icon"
                  :class="typeCssClass"
            ></span>
            <span class="c-object-label__name">Layout Object</span>
        </div>
    </div>
    <div v-if="multiSelect"
         class="c-inspector__multiple-selected"
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
        };
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
        },
        statusClass() {
            return (this.domainObject && this.domainObject.status) ? `is-status--${this.domainObject.status}` : '';
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
};
</script>
