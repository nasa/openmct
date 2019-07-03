<template>
    <div class="c-properties__section c-filter-settings">
        <li class="c-properties__row c-filter-settings__setting"
            v-for="(filter, index) in filterField.filters"
            :key="index">
            <div class="c-properties__label label"
                 :disabled="useGlobal">
                {{ filterField.name }} =
            </div>
            <div class="c-properties__value value">
                <!-- EDITING -->
                <!-- String input, editing -->
                <template v-if="!filter.possibleValues && isEditing">
                    <input class="c-input--flex"
                           type="text"
                           :id="`${filter}filterControl`"
                           :disabled="useGlobal"
                           :value="persistedValue(filter)"
                           @change="updateFilterValue($event, filter)">
                </template>

                <!-- Checkbox list, editing -->
                <template v-if="filter.possibleValues && isEditing">
                    <div class="c-checkbox-list__row"
                         v-for="value in filter.possibleValues"
                         :key="value">
                        <input class="c-checkbox-list__input"
                               type="checkbox"
                               :id="`${value}filterControl`"
                               :disabled="useGlobal"
                               @change="onUserSelect($event, filter.comparator, value)"
                               :checked="isChecked(filter.comparator, value)">
                        <span class="c-checkbox-list__value">
                            {{ value }}
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
                    <span
                        v-if="persistedFilters[filter.comparator]">
                        {{persistedFilters[filter.comparator].join(', ')}}
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
        filterField: Object,
        useGlobal: Boolean,
        persistedFilters: {
            type: Object,
            default: () => {
                return {}
            }
        }
    },
    data() {
        return {
            isEditing: this.openmct.editor.isEditing()
        }
    },
    methods: {
        toggleIsEditing(isEditing) {
            this.isEditing = isEditing;
        },
        onUserSelect(event, comparator, value){
            this.$emit('onUserSelect', this.filterField.key, comparator, value, event.target.checked);
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
        updateFilterValue(event, comparator) {
            this.$emit('onTextEnter', this.filterField.key, comparator, event.target.value);
        }
    },
    mounted() {
        this.openmct.editor.on('isEditing', this.toggleIsEditing);
    },
    beforeDestroy() {
        this.openmct.editor.off('isEditing', this.toggleIsEditing);
    }
}
</script>
