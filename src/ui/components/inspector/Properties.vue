<template>
<div class="grid-properties">
    <h2>Properties</h2>
    <ul class="l-inspector-part">
        <li class="t-repeat grid-row">
            <div class="grid-cell label">Title</div>
            <div class="grid-cell value">{{ domainObject.name }}</div>
        </li>
        <li class="t-repeat grid-row">
            <div class="grid-cell label">Type</div>
            <div class="grid-cell value">{{ typeName }}</div>
        </li>
        <li class="t-repeat grid-row" v-if="domainObject.created">
            <div class="grid-cell label">Created</div>
            <div class="grid-cell value">{{ domainObject.created }}</div>
        </li>
        <li class="t-repeat grid-row" v-if="domainObject.modified">
            <div class="grid-cell label">Modified</div>
            <div class="grid-cell value">{{ domainObject.modified }}</div>
        </li>

        <li class="t-repeat grid-row"
            v-for="prop in typeProperties"
            :key="prop.name">
            <div class="grid-cell label">{{ prop.name }}</div>
            <div class="grid-cell value">{{ prop.value }}</div>
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
