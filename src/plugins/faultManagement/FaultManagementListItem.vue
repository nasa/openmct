<template>
<div
    class="c-fault-mgmt__list data-selectable"
    :class="[
        // 'is-criticality-' + fault.severity.toLowerCase(),
        {'is-selected': isSelected},
        {'is-unacknowledged': !fault.acknowledged},
        {'is-shelved': fault.shelveInfo},
        {'is-triggering': fault.triggered}
    ]"
>
    <div class="c-fault-mgmt__checkbox">
        <input
            type="checkbox"
            :checked="isSelected"
            @input="toggleSelected"
        >
    </div>
    <div class="c-fault-mgmt__list-severity"
        :class="[
            'is-severity-' + fault.severity.toLowerCase()
        ]">
    </div>
    <div class="c-fault-mgmt__list-content">
        <div class="c-fault-mgmt__list-pathname">
            <div class="c-fault-mgmt__list-path">{{ fault.id.namespace }}</div>
            <div class="c-fault-mgmt__list-faultname">{{ fault.id.name }}</div>
        </div>
        <div class="c-fault-mgmt__list-content-right">
            <div
                class="c-fault-mgmt__list-trigVal icon-arrow-up"
                :class="[{'is-limit--upr is-limit--yellow' : true}]"
            >{{ triggerValue }}</div>
            <div 
                class="c-fault-mgmt__list-curVal c-fault-mgmt__list-curVal-alert">
                {{ currentValue }}
            </div>
            <div class="c-fault-mgmt__list-trigTime">{{ triggerTime }}</div>
        </div>

    </div>
    <div class="c-fault-mgmt__list-action-wrapper">
        <button
            class="c-fault-mgmt__list-action-button l-browse-bar__actions c-icon-button icon-3-dots"
            title="Disposition Actions"
            @click="showActionMenu"
        ></button>
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
        },
        showActionMenu(event) {
            event.stopPropagation();

            const menuItems = [
                {
                    cssClass: 'icon-bell',
                    isDisabled: this.fault.acknowledged,
                    name: 'Ack',
                    description: '',
                    onItemClicked: (e) => {
                        this.$emit('acknowledgeSelected', [this.fault]);
                    }
                },
                {
                    cssClass: 'icon-timer',
                    name: 'Shelve',
                    description: '',
                    onItemClicked: () => {
                        this.$emit('shelveSelected', [this.fault], { shelved: true });
                    }
                },
                {
                    cssClass: 'icon-timer',
                    isDisabled: Boolean(!this.fault.shelveInfo),
                    name: 'Unshelve',
                    description: '',
                    onItemClicked: () => {
                        this.$emit('shelveSelected', [this.fault], { shelved: false });
                    }
                }
            ];

            this.openmct.menus.showMenu(event.x, event.y, menuItems);
        }
    }
};
</script>
