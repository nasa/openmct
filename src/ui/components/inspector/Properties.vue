<template>
<div class="c-properties c-properties--properties">
    <div class="c-properties__header">Properties</div>
    <ul class="c-properties__section">
        <li class="c-properties__row">
            <div class="c-properties__label">Title</div>
            <div class="c-properties__value">{{ domainObject.name }}</div>
        </li>
        <li class="c-properties__row">
            <div class="c-properties__label">Type</div>
            <div class="c-properties__value">{{ typeName }}</div>
        </li>
        <li class="c-properties__row" v-if="domainObject.created">
            <div class="c-properties__label">Created</div>
            <div class="c-properties__value">{{ domainObject.created }}</div>
        </li>
        <li class="c-properties__row" v-if="domainObject.modified">
            <div class="c-properties__label">Modified</div>
            <div class="c-properties__value">{{ domainObject.modified }}</div>
        </li>
        <li class="c-properties__row"
            v-for="prop in typeProperties"
            :key="prop.name">
            <div class="c-properties__label">{{ prop.name }}</div>
            <div class="c-properties__value">{{ prop.value }}</div>
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
    computed: {
        type() {
            return this.openmct.types.get(this.domainObject.type);
        },
        typeName() {
            if (!this.type) {
                return `Unknown: ${this.domainObject.type}`;
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
                        }, this.domainObject)
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
            if (selection.length === 0) {
                this.domainObject = {};
                return;
            }
            this.domainObject = selection[0].context.item;
        }
    }
}
</script>
