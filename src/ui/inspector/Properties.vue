<template>
<div class="c-inspector__properties c-inspect-properties">
    <div class="c-inspect-properties__header">
        Details
    </div>
    <ul
        v-if="!multiSelect && !singleSelectNonObject"
        class="c-inspect-properties__section"
    >
        <li class="c-inspect-properties__row">
            <div class="c-inspect-properties__label">
                Title
            </div>
            <div class="c-inspect-properties__value">
                {{ item.name }}
            </div>
        </li>
        <li class="c-inspect-properties__row">
            <div class="c-inspect-properties__label">
                Type
            </div>
            <div class="c-inspect-properties__value">
                {{ typeName }}
            </div>
        </li>
        <li
            v-if="item.created"
            class="c-inspect-properties__row"
        >
            <div class="c-inspect-properties__label">
                Created
            </div>
            <div class="c-inspect-properties__value">
                {{ formatTime(item.created) }}
            </div>
        </li>
        <li
            v-if="item.modified"
            class="c-inspect-properties__row"
        >
            <div class="c-inspect-properties__label">
                Modified
            </div>
            <div class="c-inspect-properties__value">
                {{ formatTime(item.modified) }}
            </div>
        </li>
        <li
            v-for="prop in typeProperties"
            :key="prop.name"
            class="c-inspect-properties__row"
        >
            <div class="c-inspect-properties__label">
                {{ prop.name }}
            </div>
            <div class="c-inspect-properties__value">
                {{ prop.value }}
            </div>
        </li>
    </ul>
    <div
        v-if="multiSelect"
        class="c-inspect-properties__row--span-all"
    >
        No properties to display for multiple items
    </div>
    <div
        v-if="singleSelectNonObject"
        class="c-inspect-properties__row--span-all"
    >
        No properties to display for this item
    </div>
</div>
</template>

<script>
import Moment from "moment";

export default {
    inject: ['openmct'],
    data() {
        return {
            domainObject: {},
            multiSelect: false
        };
    },
    computed: {
        item() {
            return this.domainObject || {};
        },
        type() {
            return this.openmct.types.get(this.item.type);
        },
        typeName() {
            if (!this.type) {
                return `Unknown: ${this.item.type}`;
            }

            return this.type.definition.name;
        },
        typeProperties() {
            if (!this.type) {
                return [];
            }

            let definition = this.type.definition;
            if (!definition.form || definition.form.length === 0) {
                return [];
            }

            return definition.form
                .map((field) => {
                    let path = field.property;
                    if (typeof path === 'string') {
                        path = [path];
                    }

                    return {
                        name: field.name,
                        path
                    };
                })
                .filter(field => Array.isArray(field.path))
                .map((field) => {
                    return {
                        name: field.name,
                        value: field.path.reduce((object, key) => {
                            return object[key];
                        }, this.item)
                    };
                });
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

                return;
            } else {
                this.multiSelect = false;
                this.domainObject = selection[0][0].context.item;
            }
        },
        formatTime(unixTime) {
            return Moment.utc(unixTime).format('YYYY-MM-DD[\n]HH:mm:ss') + ' UTC';
        }
    }
};
</script>
