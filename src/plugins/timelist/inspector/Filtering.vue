<template>
<li class="c-inspect-properties__row">
    <div v-if="canEdit"
         class="c-inspect-properties__hint span-all"
    >Filter this view by comma-separated keywords.</div>
    <div class="c-inspect-properties__label"
         title="Filter by keyword."
    >Filters</div>
    <div v-if="canEdit"
         class="c-inspect-properties__value"
         :class="{'form-error': hasError}"
    >
        <input v-model="filterValue"
               class="c-input"
               type="text"
               @change="updateForm('filter')"
        >
        <button class="c-button">Preview</button>
    </div>
    <div v-else
         class="c-inspect-properties__value"
    >
        {{ filterValue }}
    </div>
</li>
</template>

<script>
export default {
    inject: ['openmct', 'domainObject'],
    data() {
        return {
            isEditing: this.openmct.editor.isEditing(),
            filterValue: this.domainObject.configuration.filter,
            hasError: false
        };
    },
    computed: {
        canEdit() {
            return this.isEditing && !this.domainObject.locked;
        }
    },
    mounted() {
        this.openmct.editor.on('isEditing', this.setEditState);
    },
    beforeDestroy() {
        this.openmct.editor.off('isEditing', this.setEditState);
    },
    methods: {
        setEditState(isEditing) {
            this.isEditing = isEditing;
            if (!this.isEditing && this.hasError) {
                this.filterValue = this.domainObject.configuration.filter;
                this.hasError = false;
            }
        },
        updateForm(property) {
            if (!this.isValid()) {
                this.hasError = true;

                return;
            }

            this.hasError = false;

            this.$emit('updated', {
                property,
                value: this.filterValue.replace(/,(\s)*$/, '')
            });
        },
        isValid() {
            // Test for any word character, any whitespace character or comma
            if (this.filterValue === '') {
                return true;
            }

            const regex = new RegExp(/^([a-zA-Z0-9_\s,])+$/g);

            return regex.test(this.filterValue);
        }
    }
};
</script>
