<template>
<div
    :style="position"
    class="c-status-poll-panel c-status-poll-panel--admin"
    @click.stop="noop"
>
    <div class="c-status-poll-panel__section c-status-poll-panel__top">
        <div
            class="c-status-poll-panel__title"
        >Manage Status Poll</div>
        <div class="c-status-poll-panel__updated">Last updated: {{ pollQuestionUpdated }}</div>
    </div>

    <div class="c-status-poll__section c-status-poll-panel__content c-spq">
        <!-- Grid layout -->
        <div class="c-spq__label">Current:</div>
        <div class="c-spq__value c-status-poll-panel__poll-question">{{ currentPollQuestion }}</div>

        <template v-if="canGetStatusSummary">
            <div class="c-spq__label">Reporting:</div>
            <div class="c-spq__value c-status-poll-panel__poll-reporting c-status-poll-report">
                <div
                    v-for="entry in statusCounts"
                    :key="entry.status.key"
                    class="c-status-poll-report__count"
                    :style="[{
                        background: entry.status.statusBgColor,
                        color: entry.status.statusFgColor
                    }]"
                >
                    <div
                        class="c-status-poll-report__count-type"
                        :class="entry.status.iconClass"
                    ></div>
                    <div class="c-status-poll-report__count-value">
                        {{ entry.userCount }}
                    </div>
                </div>
            </div>
        </template>

        <div class="c-spq__label">New poll:</div>
        <div class="c-spq__value c-status-poll-panel__poll-new-question">
            <input
                v-model="newPollQuestion"
                type="text"
                name="newPollQuestion"
            >
            <button
                class="c-button"
                @click="updatePollQuestion"
            >Update</button>
        </div>
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
            pollQuestionUpdated: '--',
            currentPollQuestion: '--',
            newPollQuestion: undefined,
            canGetStatusSummary: false,
            statusCounts: []
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
    mounted() {
        this.unsubscribe = [];
        this.fetchCurrentPoll();
        this.subscribeToPollQuestion();
        this.canGetStatusSummary = this.openmct.user.canGetUsersForStatus();
        if (this.canGetStatusSummary) {
            this.fetchStatusSummary();
        }
    },
    beforeDestroy() {
        this.unsubscribe.forEach(unsubscribe => unsubscribe);
    },
    methods: {
        async fetchCurrentPoll() {
            const pollQuestion = await this.openmct.user.getPollQuestion();
            if (pollQuestion !== undefined) {
                this.setPollQuestion(pollQuestion);
            }

        },
        subscribeToPollQuestion() {
            this.openmct.user.on('pollQuestionChange', this.setPollQuestion);
        },
        setPollQuestion(pollQuestion) {
            this.currentPollQuestion = pollQuestion.question;
            this.pollQuestionUpdated = new Date(pollQuestion.timestamp).toISOString();
            this.indicator.text(pollQuestion.question);
        },
        async updatePollQuestion() {
            await this.openmct.user.setPollQuestion(this.newPollQuestion);
            this.newPollQuestion = undefined;
        },
        async fetchStatusSummary() {
            const allStatuses = await this.openmct.user.getPossibleStatuses();
            const usersByStatus = await Promise.all(allStatuses.map(status => {
                return this.openmct.user.getUsersForStatus(status.key);
            }));
            const statusToUserCount = allStatuses.map((status, index) => {
                return {
                    status,
                    userCount: usersByStatus[index].length
                };
            });

            this.statusCounts = statusToUserCount;
        },
        clearAllResponses() {
            this.openmct.user.clearAllStatuses();
        },
        noop() {}
    }

};
</script>
