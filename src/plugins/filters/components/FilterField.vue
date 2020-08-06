<template>
<div class="c-inspect-properties__section c-filter-settings">
    <li
        v-for="(filter, index) in filterField.filters"
        :key="index"
        class="c-inspect-properties__row c-filter-settings__setting"
    >
        <div
            class="c-inspect-properties__label label"
            :disabled="useGlobal"
        >
            {{ filterField.name }} =
        </div>
        <div class="c-inspect-properties__value value">
            <!-- EDITING -->
            <!-- String input, editing -->
            <template v-if="!filter.possibleValues && isEditing">
                <input
                    :id="`${filter}filterControl`"
                    class="c-input--flex"
                    type="text"
                    :disabled="useGlobal"
                    :value="persistedValue(filter)"
                    @change="updateFilterValue($event, filter)"
                >
            </template>

            <!-- Checkbox list, editing -->
            <template v-if="filter.possibleValues && isEditing">
                <div
                    v-for="option in filter.possibleValues"
                    :key="option.value"
                    class="c-checkbox-list__row"
                >
                    <input
                        :id="`${option.value}filterControl`"
                        class="c-checkbox-list__input"
                        type="checkbox"
                        :disabled="useGlobal"
                        :checked="isChecked(filter.comparator, option.value)"
                        @change="updateFilterValue($event, filter.comparator, option.value)"
                    >
                    <span class="c-checkbox-list__value">
                        {{ option.label }}
                    </span>
                </div>
            </template>

            <!-- BROWSING -->
            <!-- String input, NOT editing -->
            <template v-if="!filter.possibleValues && !isEditing">
                {{ persistedValue(filter) }}
            </template>

            <!-- Checkbox list, NOT editing -->
            <template v-if="filter.possibleValues && !isEditing">
                <span v-if="persistedFilters[filter.comparator]">
                    {{ getFilterLabels(filter) }}
                </span>
            </template>
        </div>
    </li>
</div>
</template>

<script>
export default {
    inject: [
        'openmct'
    ],
    props: {
        filterField: {
            type: Object,
            required: true
        },
        useGlobal: Boolean,
        persistedFilters: {
            type: Object,
            default: () => {
                return {};
            }
        }
    },
    data() {
        return {
            isEditing: this.openmct.editor.isEditing()
        };
    },
    mounted() {
        this.openmct.editor.on('isEditing', this.toggleIsEditing);
    },
    beforeDestroy() {
        this.openmct.editor.off('isEditing', this.toggleIsEditing);
    },
    methods: {
        toggleIsEditing(isEditing) {
            this.isEditing = isEditing;
        },
        isChecked(comparator, value) {
            if (this.persistedFilters[comparator] && this.persistedFilters[comparator].includes(value)) {
                return true;
            } else {
                return false;
            }
        },
        persistedValue(comparator) {
            return this.persistedFilters && this.persistedFilters[comparator];
        },
        updateFilterValue(event, comparator, value) {
            if (value !== undefined) {
                this.$emit('filterSelected', this.filterField.key, comparator, value, event.target.checked);
            } else {
                this.$emit('filterTextValueChanged', this.filterField.key, comparator, event.target.value);
            }
        },
        getFilterLabels(filter) {
            return this.persistedFilters[filter.comparator].reduce((accum, filterValue) => {
                accum.push(filter.possibleValues.reduce((label, possibleValue) => {
                    if (filterValue === possibleValue.value) {
                        label = possibleValue.label;
                    }

                    return label;
                }, ''));

                return accum;
            }, []).join(', ');
        }
    }
};
</script>
