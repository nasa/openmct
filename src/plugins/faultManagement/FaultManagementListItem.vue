<template>
<div class="c-fault-mgmt__list">
    <span class="c-fault-mgmt__checkbox">
        <input
            type="checkbox"
            :checked="isSelected"
            @input="toggleSelected"
        >
    </span>
    <span class="c-fault-mgmt__list-severity icon-alert-rect">{{ severity }}</span>
    <span class="c-fault-mgmt__list-content">
        <span class="c-fault-mgmt__list-pathname">
            <div class="c-fault-mgmt__list-path">{{ fault.id.namespace }}</div>
            <div class="c-fault-mgmt__list-faultname">{{ fault.id.name }}</div>
        </span>
        <span class="c-fault-mgmt__list-trigVal">{{ triggerValue }}</span>
        <span class="c-fault-mgmt__list-curVal">{{ currentValue }}</span>
        <!-- <span class="c-fault-mgmt-list-ackStatus">{{ acknowledged }}</span> -->
        <span class="c-fault-mgmt__list-trigTime">{{ triggerTime }}</span>
    </span>
    <span class="c-fault-mgmt__list-action-button l-browse-bar__actions c-icon-button icon-3-dots"></span>

</div>
</template>

<script>
export default {
    components: {
    },
    inject: ['openmct', 'domainObject'],
    props: {
        fault: {
            type: Object,
            required: true
        },
        isSelected: {
            type: Boolean,
            default: () => {
                return false;
            }
        }
    },
    data() {
        return {
        };
    },
    computed: {
        acknowledged() {
            return this.fault?.acknowledged;
        },
        currentValue() {
            return this.fault?.parameterDetail?.currentValue?.engValue?.doubleValue;
        },
        name() {
            return `${this.fault?.id?.name}/${this.fault?.id?.namespace}`;
        },
        severity() {
            return this.fault?.severity;
        },
        triggerTime() {
            return this.fault?.triggerTime;
        },
        triggerValue() {
            return this.fault?.parameterDetail?.triggerValue?.engValue?.doubleValue;
        }
    },
    watch: {
    },
    mounted() {
    },
    beforeDestroy() {
    },
    methods: {
        toggleSelected(event) {
            const faultData = {
                fault: this.fault,
                selected: event.target.checked
            };

            event.target.checked = !event.target.checked;

            this.$emit('toggleSelected', faultData);
        }
    }
};
</script>
