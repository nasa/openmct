<template>
<th
    v-if="isSortable"
    class="is-sortable"
    :class="{
        'is-sorting': currentSort === property,
        'asc': direction,
        'desc': !direction
    }"
    @click="sort(property, direction)"
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
        currentSort: {
            type: String,
            required: true
        },
        title: {
            type: String,
            required: true
        },
        direction: {
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
    methods: {
        sort(property, direction) {
            this.$emit('sort', {
                property,
                direction
            });
        }
    }
};
</script>
