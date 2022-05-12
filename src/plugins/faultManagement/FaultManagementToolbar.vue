<template>
<div class="c-fault-mgmt__toolbar">
    <button
        class="c-icon-button icon-bell"
        title="Acknowledge selected faults"
        @click="acknowledgeSelected"
    >
        <span
            title="Acknowledge selected faults"
            class="c-icon-button__label"
        >
            Acknowledge
        </span>
    </button>

    <button
        class="c-icon-button icon-timer"
        title="Shelve selected faults"
        @click="shelveSelected"
    >
        <span
            title="Shelve selected items"
            class="c-icon-button__label"
        >
            Shelve
        </span>
    </button>
</div>
</template>

<script>
export default {
    components: {
    },
    inject: ['openmct', 'domainObject'],
    props: {
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
        acknowledgeSelected() {
            console.log('acknowledgeSelected');
            this.$emit('acknowledgeSelected');
        },
        shelveSelected() {
            console.log('shelveSelected');
            this.$emit('shelveSelected');
        }
    }
};
</script>
