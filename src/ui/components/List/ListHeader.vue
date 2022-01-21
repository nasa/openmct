<template>
<th v-if="isSortable"
    class="is-sortable"
    :class="{
        'is-sorting': sortBy === property,
        'asc': ascending,
        'desc': !ascending
    }"
    @click="sort(property, defaultDirection)"
>
    {{ title }}
</th>
<th v-else>
    {{ title }}
</th>
</template>

<script>

export default {
    inject: ['openmct'],
    props: {
        property: {
            type: String,
            required: true
        },
        title: {
            type: String,
            required: true
        },
        defaultDirection: {
            type: Boolean,
            required: true
        },
        isSortable: {
            type: Boolean,
            default() {
                return false;
            }
        }
    },
    data() {
        return {
            ascending: false,
            sortBy: undefined
        };
    },
    methods: {
        sort(field, defaultDirection) {
            this.$emit('sort', {
                field,
                defaultDirection
            });
        }
    }
};
</script>
