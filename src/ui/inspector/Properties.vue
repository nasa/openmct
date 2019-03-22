<template>
<div class="c-properties c-properties--properties">
    <div class="c-properties__header">Properties</div>
    <ul class="c-properties__section" v-if="!multiSelect">
        <li class="c-properties__row">
            <div class="c-properties__label">Title</div>
            <div class="c-properties__value">{{ item.name }}</div>
        </li>
        <li class="c-properties__row">
            <div class="c-properties__label">Type</div>
            <div class="c-properties__value">{{ typeName }}</div>
        </li>
        <li class="c-properties__row" v-if="item.created">
            <div class="c-properties__label">Created</div>
            <div class="c-properties__value c-ne__text">{{ formatTime(item.created) }}</div>
        </li>
        <li class="c-properties__row" v-if="item.modified">
            <div class="c-properties__label">Modified</div>
            <div class="c-properties__value c-ne__text">{{ formatTime(item.modified) }}</div>
        </li>
        <li class="c-properties__row"
            v-for="prop in typeProperties"
            :key="prop.name">
            <div class="c-properties__label">{{ prop.name }}</div>
            <div class="c-properties__value">{{ prop.value }}</div>
        </li>
    </ul>
    <div class="c-properties__row--span-all" v-if="multiSelect">No properties to display for multiple items</div>
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
        }
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
                    let path = field.property
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
                        value: field.path.reduce((object, field) => {
                            return object[field];
                        }, this.item)
                    };
                });
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
}
</script>
