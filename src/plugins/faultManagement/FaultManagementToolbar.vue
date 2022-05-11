<template>
<div class="c-fault-mgmt-toolbar">
    <button @click="acknowledgeSelected">Acknowledge</button>
    <button @click="shelveSelected">Shelve</button>
    <button></button>
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
