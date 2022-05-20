<template>
<div
    class="c-fault-mgmt__list data-selectable"
    :class="[
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
    <div
        class="c-fault-mgmt__list-severity"
        :title="fault.severity.toLowerCase()"
        :class="[
            'is-severity-' + fault.severity.toLowerCase()
        ]"
    >
    </div>
    <div class="c-fault-mgmt__list-content">
        <div class="c-fault-mgmt__list-pathname">
            <div class="c-fault-mgmt__list-path">{{ fault.id.namespace }}</div>
            <div class="c-fault-mgmt__list-faultname">{{ fault.id.name }}</div>
        </div>
        <div class="c-fault-mgmt__list-content-right">
            <div
                class="c-fault-mgmt__list-trigVal"
                :class="tripValueClassname"
                title="Trip Value"
            >{{ triggerValue }}</div>
            <div
                class="c-fault-mgmt__list-curVal"
                :class="liveValueClassname"
                title="Live Value"
            >
                {{ liveValue }}
            </div>
            <div
                class="c-fault-mgmt__list-trigTime"
            >{{ triggerTime }}
            </div>
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
        liveValue() {
            return this.fault?.parameterDetail?.currentValue?.engValue?.doubleValue;
        },
        liveValueClassname() {
            const currentValue = this.fault?.parameterDetail?.currentValue;
            if (!currentValue || currentValue.monitoringResult === 'IN_LIMITS') {
                return '';
            }

            let classname = this.getRangeConditionBasedClassname(currentValue.rangeCondition);
            classname += ' ';
            classname += this.getRangeMonitoringResultClassname(currentValue.monitoringResult);

            console.log('liveValueClassname', this.liveValue, classname);

            return classname.trim();
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
        },
        tripValueClassname() {
            const triggerValue = this.fault?.parameterDetail?.triggerValue;
            if (!triggerValue || triggerValue.monitoringResult === 'IN_LIMITS') {
                return '';
            }

            let classname = this.getRangeConditionBasedClassname(triggerValue.rangeCondition);
            classname += ' ';
            classname += this.getRangeMonitoringResultClassname(triggerValue.monitoringResult);

            console.log('tripValueClassname', classname);
            return classname.trim();
        }
    },
    watch: {
    },
    mounted() {
    },
    beforeDestroy() {
    },
    methods: {
        getRangeConditionBasedClassname(rangeCondition) {
            if (rangeCondition === 'LOW') {
                return 'is-limit--lwr';
            }

            if (rangeCondition === 'HIGH') {
                return 'is-limit--upr';
            }

            return '';
        },
        getRangeMonitoringResultClassname(monitoringResult) {
            if (monitoringResult === 'CRITICAL') {
                return 'is-limit--red';
            }

            if (monitoringResult === 'WARNING') {
                return 'is-limit--yellow';
            }

            if (monitoringResult === 'WATCH') {
                return 'is-limit--cyan';
            }

            return '';
        },
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
                    name: 'Acknowledge',
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
