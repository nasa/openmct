<template>
<div class="c-fault-mgmt__toolbar">
    <button
        class="c-icon-button icon-bell"
        title="Acknowledge selected faults"
        :disabled="disableAcknowledge"
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
        :disabled="disableShelve"
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
        selectedFaults: {
            type: Object,
            default() {
                return {};
            }
        }
    },
    data() {
        return {
            disableAcknowledge: true,
            disableShelve: true
        };
    },
    computed: {

    },
    watch: {
        selectedFaults(newSelectedFaults) {
            const selectedfaults = Object.values(newSelectedFaults);

            let disableAcknowledge = true;
            let disableShelve = true;

            selectedfaults.forEach(fault => {
                if (!fault.shelveInfo) {
                    disableShelve = false;
                }

                if (!fault.acknowledged) {
                    disableAcknowledge = false;
                }
            });

            this.disableAcknowledge = disableAcknowledge;
            this.disableShelve = disableShelve;
        }
    },
    mounted() {
    },
    beforeDestroy() {
    },
    methods: {
        acknowledgeSelected() {
            this.$emit('acknowledgeSelected');
        },
        shelveSelected() {
            this.$emit('shelveSelected');
        }
    }
};
</script>
