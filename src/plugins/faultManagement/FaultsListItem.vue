<template>
<div
    class="c-faults-list-item"
    :class="[
        'is-criticality-' + fault.severity.toLowerCase(),
        {'is-selected': isSelected},
        {'is-suppressed': fault.shelveInfo},
        {'is-triggering': fault.triggered}
    ]"
>
    <label @click="faultItemBoxSelected">
        <input
            :id="faultId"
            type="checkbox"
            :checked="isSelected"
        >
    </label>
    <div
        class="__contents"
        @click="faultItemSelected"
    >
        <div
            class="__criticality-icon"
            :class="[getCriticalityIcon(fault.severity.toLowerCase()), {'is-blinking': isBlinking(fault, faultInfo)}]"
        ></div>
        <div class="__details">
            <div class="__name">

            </div>
            <div class="__data">
                {{ fault.triggerTime }}
                <span
                    v-if="fault.shelveInfo"
                    class="__disposition icon-clock"
                >
                    Suppressed
                </span>
                <span
                    v-if="isSnoozed"
                    class="__disposition icon-timer"
                >
                    Snoozed for {{ snoozeTimer }}
                </span>
                <span
                    v-if="fault.acknowledged"
                    class="__disposition icon-check"
                >
                    Acknowledged
                </span>
            </div>
            <div class="__tags">
                <span
                    v-for="tag in tags"
                    :key="tag.name"
                    class="__tag"
                    :style="[{'backgroundColor': tag.color}]"
                >
                    {{ tag.name }}
                </span>
            </div>
        </div>
        <div class="__events-counter">
            <span
                class="__events-counter-item"
                :class="{ 'icon-asterisk': fault.triggered }"
                :title="isTriggeringMsg"
            >
                {{ fault.violations }} events
            </span>
        </div>
        <div :class="{ '__assignee icon-person' : userName.length }">
            {{ userName }}
        </div>
        <div class="__comments-count">
            <div
                class="c-comment-bubble"
                @click.stop="showComments"
            >
                <div class="c-comment-bubble__num">{{ logCount }}</div>
                <svg viewBox="0 0 100 100">
                    <rect
                        width="100"
                        height="70"
                    />
                    <polygon points="20,70 20,100 60,70" />
                </svg>
            </div>
        </div>
    </div>
</div>
</template>

<script>

export default {
    inject: ['openmct', 'domainObject'],
    props: {
        fault: {
            type: Object,
            required: true,
            default() {
                return {};
            }
        },
        faultInfo: {
            type: Object,
            required: true,
            default() {
                return {};
            }
        },
        isSelected: {
            type: Boolean,
            required: true,
            default() {
                return false;
            }
        },
        index: {
            type: Number,
            required: true,
            default() {
                return 0;
            }
        }
    },
    data() {
        return {
            snoozeTimeout: false,
            snoozeTimer: ''
        };
    },
    computed: {
        faultId() {
            return createFaultId(this.fault);
        },
        logCount() {
            return this.faultInfo.logCount || 0;
        },
        tags() {
            const tagInfo = this.faultInfo.tagInfo || {};

            return tagInfo.tags || [];
        },
        userName() {
            const user = this.faultInfo.userInfo || {};

            return user.displayName || '';
        },
        isSnoozed() {
            const snoozeInfo = this.faultInfo.snoozeInfo;
            const isSnooze = snoozeInfo && snoozeInfo.isSnooze;
            if (isSnooze && snoozeInfo.duration === 0) {
                // this.snoozeTimer = '∞';

                return isSnooze;
            }

            if (!this.snoozeTimeout) {
                // this.snoozeTimeout = isSnooze;
                this.updateSnoozeTimer();
            }

            return isSnooze;
        },
        isTriggeringMsg() {
            return this.fault.triggered ? 'This fault is currently being triggered' : '';
        }
    },
    mounted() {
        this.faultItemSelected = debounce(this.faultItemSelected.bind(this), 200);
    },
    beforeDestroy() {
        clearTimeout(this.snoozeTimeout);
    },
    methods: {
        faultItemBoxSelected(event) {
            const isSelected = !this.isSelected;
            const data = {
                isSelected,
                fault: this.fault,
                faultInfo: this.faultInfo,
                view: 'fault-inspector'
            };
            this.$emit('faultItemSelected', data);
        },
        faultItemSelected(event, view = 'fault-inspector') {
            const metaKey = event.metaKey || event.ctrlKey;
            const shiftKey = event.shiftKey;
            if (metaKey || event.shiftKey) {
                document.getSelection().removeAllRanges();
            }

            const isSelected = metaKey ? !this.isSelected : true;
            this.$emit('faultItemSelected', {
                fault: this.fault,
                faultInfo: this.faultInfo,
                index: this.index,
                isSelected,
                shiftKey,
                unselectAll: !metaKey && !shiftKey,
                view
            });
        },
        showComments(event) {
            this.faultItemSelected(event, 'fault-logs');
        },
        updateSnoozeTimer() {
            if (!this.snoozeTimeout) {
                this.snoozeTimer = '';

                return;
            }
        }
    }
};

</script>
