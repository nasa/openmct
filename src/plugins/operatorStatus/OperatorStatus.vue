<template>
<div
    :style="position"
    class="c-status-poll-panel c-status-poll-panel--operator"
    @click.stop="noop"
>
    <div class="c-status-poll-panel__section c-status-poll-panel__top">
        <div
            class="c-status-poll-panel__title"
        >Status Poll</div>
        <div class="c-status-poll-panel__user-role icon-person">{{ role }}</div>
        <div class="c-status-poll-panel__updated">{{ pollQuestionUpdated }}</div>
    </div>

    <div class="c-status-poll-panel__section c-status-poll-panel__poll-question">
        {{ currentPollQuestion }}
    </div>

    <div class="c-status-poll-panel__section c-status-poll-panel__bottom">
        <div class="c-status-poll-panel__set-status-label">My status:</div>
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
            selectedStatus: undefined,
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
            this.role = await this.openmct.user.getStatusRoleForCurrentUser();
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
            this.indicator.text(pollQuestion.question);
        },
        async fetchMyStatus() {
            const activeStatusRole = await this.openmct.user.getStatusRoleForCurrentUser();
            const status = await this.openmct.user.getStatusForRole(activeStatusRole);

            this.setStatus(status);
        },
        subscribeToMyStatus() {
            this.openmct.user.on('statusChange', this.setStatus);
        },
        subscribeToPollQuestion() {
            this.openmct.user.on('pollQuestionChange', this.setPollQuestion);
        },
        setStatus(status) {
            this.selectedStatus = status.key;
            this.indicator.iconClass(status.iconClassPoll);
            this.indicator.statusClass(status.statusClass);
            if (this.isDefaultStatus(status)) {
                this.indicator.text(this.currentPollQuestion);
            } else {
                this.indicator.text(status.label);
            }
        },
        isDefaultStatus(status) {
            return status.key === this.allStatuses[0].key;
        },
        findStatusByKey(statusKey) {
            return this.allStatuses.find(possibleMatch => possibleMatch.key === statusKey);
        },
        async changeStatus() {
            if (this.selectedStatus !== undefined) {
                const statusObject = this.findStatusByKey(this.selectedStatus);

                await this.openmct.user.setStatusForRole(this.role, statusObject);
            }

        },
        noop() {}
    }
};
</script>
