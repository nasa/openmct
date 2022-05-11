<template>
<div>
    <span>
        <input
            type="checkbox"
            :checked="isSelected"
            @input="toggleSelected"
        >
    </span>
    <span>{{ severity }}</span>
    <span>{{ name }}</span>
    <span>{{ triggerValue }}</span>
    <span>{{ currentValue }}</span>
    <span>{{ acknowledged }}</span>
    <span>{{ triggerTime }}</span>
    <div class="c-fault-mgmt-list-item">
        {{ fault.id.name }}
        {{ fault.id.namespace }}
    </div>
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
