<template>
<div
    :style="position"
    class="c-menu"
    @click.stop="noop"
>
    <div>My Role: {{ role }}</div>
    <div>Current Poll Question: {{ currentPollQuestion }}</div>
    <div>Current Poll Date: {{ pollQuestionUpdated }}</div>
    <div>My Status: {{ roleStatus.label }}</div>
    <div>Set Status:
        <select
            v-model="selectedStatus"
            name="setStatus"
            @change="changeStatus"
        >
            <option
                v-for="status in allStatuses"
                :key="status.key"
                :value="status.key"
            >
                {{ status.label }}
            </option>
        </select>
    </div>
</div>
</template>

<script>
const STATUS_CLASS = {
    "GO": {
        icon: "icon-check",
        status: "s-status-ok"
    },
    "NO_GO": {
        icon: "icon-x",
        status: "s-status-error"
    },
    "MAYBE": {
        icon: "icon-alert-triangle",
        status: "s-status-warning"
    },
    "NO_STATUS": {
        icon: "icon-info",
        status: ""
    }
};

export default {
    inject: ['openmct', 'indicator'],
    props: {
        positionX: {
            type: Number,
            required: true
        },
        positionY: {
            type: Number,
            required: true
        }
    },
    data() {
        return {
            allRoles: [],
            role: '--',
            pollQuestionUpdated: '--',
            currentPollQuestion: '--',
            roleStatus: '--',
            selectedStatus: 'no-go',
            allStatuses: []
        };
    },
    computed: {
        position() {
            return {
                position: 'absolute',
                left: `${this.positionX}px`,
                top: `${this.positionY}px`
            };
        }
    },
    beforeDestroy() {
        this.openmct.user.off('statusChange', this.setStatus);
        this.openmct.user.off('pollQuestionChange', this.setPollQuestion);
    },
    async mounted() {
        this.unsubscribe = [];
        await this.fetchUser();
        await this.findFirstApplicableRole();
        this.fetchPossibleStatusesForUser();
        this.fetchCurrentPoll();
        this.fetchMyStatus();
        this.subscribeToMyStatus();
        this.subscribeToPollQuestion();
    },
    methods: {
        async findFirstApplicableRole() {
            this.role = await this.openmct.user.getActiveStatusRole();
        },
        async fetchUser() {
            this.user = await this.openmct.user.getCurrentUser();
        },
        async fetchCurrentPoll() {
            const pollQuestion = await this.openmct.user.getPollQuestion();

            this.setPollQuestion(pollQuestion);
        },
        async fetchPossibleStatusesForUser() {
            this.allStatuses = await this.openmct.user.getPossibleStatuses();
        },
        setPollQuestion(pollQuestion) {
            this.currentPollQuestion = pollQuestion.question;
            this.pollQuestionUpdated = new Date(pollQuestion.timestamp).toISOString();
        },
        async fetchMyStatus() {
            const status = await this.openmct.user.getStatus();

            this.setStatus(status);
        },
        subscribeToMyStatus() {
            this.openmct.user.on('statusChange', this.setStatus);
        },
        subscribeToPollQuestion() {
            this.openmct.user.on('pollQuestionChange', this.setPollQuestion);
        },
        setStatus(status) {
            this.roleStatus = status;
            this.selectedStatus = status.key;
            this.indicator.iconClass(STATUS_CLASS[status.key.toUpperCase()].icon);
            this.indicator.statusClass(STATUS_CLASS[status.key.toUpperCase()].status);
            this.indicator.text(status.label);
        },
        findStatusByKey(statusKey) {
            return this.allStatuses.find(possibleMatch => possibleMatch.key === statusKey);
        },
        async changeStatus() {
            if (this.selectedStatus !== undefined && this.selectedStatus !== this.roleStatus.key) {
                await this.openmct.user.setStatus(this.findStatusByKey(this.selectedStatus));
            }

        },
        noop() {}
    }
};
</script>
