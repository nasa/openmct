<template>
<div v-if="!activity"
     class="c-inspector__properties c-inspect-properties"
>
    <div class="c-inspect-properties__header">
        Details
    </div>
    <ul
        v-if="hasDetails"
        class="c-inspect-properties__section"
    >
        <Component
            :is="getComponent(detail)"
            v-for="detail in details"
            :key="detail.name"
            :detail="detail"
        />

    </ul>
    <div
        v-else
        class="c-inspect-properties__row--span-all"
    >
        {{ noDetailsMessage }}
    </div>
</div>
</template>

<script>
import DetailText from './DetailText.vue';
import DetailTime from './DetailTime.vue';

export default {
    components: {
        DetailText,
        DetailTime
    },
    inject: ['openmct'],
    data() {
        return {
            selection: undefined
        };
    },
    computed: {
        details() {
            return this.customDetails ? this.customDetails : this.domainObjectDetails;
        },
        customDetails() {
            if (this.context === undefined) {
                return;
            }

            return this.context.details;
        },
        domainObject() {
            if (this.context === undefined) {
                return;
            }

            return this.context.item;
        },
        type() {
            if (this.domainObject === undefined) {
                return;
            }

            return this.openmct.types.get(this.domainObject.type);
        },
        domainObjectDetails() {
            if (this.domainObject === undefined) {
                return;
            }

            const title = this.domainObject.name;
            const typeName = this.type ? this.type.definition.name : `Unknown: ${this.domainObject.type}`;
            const timestampLabel = this.domainObject.modified ? 'Modified' : 'Created';
            const timestamp = this.domainObject.modified ? this.domainObject.modified : this.domainObject.created;

            const details = [
                {
                    name: 'Title',
                    value: title
                },
                {
                    name: 'Type',
                    value: typeName
                }
            ];

            if (timestamp !== undefined) {
                details.push(
                    {
                        name: timestampLabel,
                        value: timestamp,
                        component: 'time'
                    }
                );
            }

            return [...details, ...this.typeProperties];
        },
        context() {
            if (
                !this.selection
                || !this.selection.length
                || !this.selection[0].length
            ) {
                return;
            }

            return this.selection[0][0].context;
        },
        hasDetails() {
            return Boolean(
                this.details
                && this.details.length
                && !this.multiSelection
            );
        },
        multiSelection() {
            return this.selection && this.selection.length > 1;
        },
        noDetailsMessage() {
            return this.multiSelection
                ? 'No properties to display for multiple items'
                : 'No properties to display for this item';
        },
        activity() {
            if (this.context === undefined) {
                return;
            }

            return this.context.activity;
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
        getComponent(detail) {
            const component = detail.component ? detail.component : 'text';

            return `detail-${component}`;
        },
        updateSelection(selection) {
            this.selection = selection;
        }
    }
};
</script>
