<template>
<div>
    <span>
        <input
            type="checkbox"
            @input="selectAll"
        >
    </span>
    <span>severity</span>
    <span>name</span>
    <span>trippedValue</span>
    <span>liveValue</span>
    <span>acknowledged</span>
    <span>time</span>
</div>
</template>

<script>
export default {
    components: {
    },
    inject: ['openmct', 'domainObject'],
    props: {
        selectedFaultsCount: {
            type: Number,
            default() {
                return 0;
            }
        }
    },
    data() {
        return {
        };
    },
    computed: {
    },
    watch: {
    },
    mounted() {
    },
    beforeDestroy() {
    },
    methods: {
        selectAll(e) {
            this.$emit('selectAll', e.target.checked);
        }
    }
};
</script>
