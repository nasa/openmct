<template>
<div
    :style="position"
    class="c-menu"
    @click.stop="noop"
>
    <div>Current Poll Question: {{ currentPollQuestion }}</div>
    <div>Current Poll Date: {{ pollQuestionUpdated }}</div>
    <div class="c-form__row">
        <div class="c-form-row__label">Set Poll Question:</div>
        <div class="c-form-row__controls">
            <input
                v-model="newPollQuestion"
                type="text"
                name="newPollQuestion"
            >
        </div>
        <div class="c-form-row__controls">
            <button
                class="c-button"
                @click="updatePollQuestion"
            >Update</button>
        </div>
    </div>
    <div
        v-if="canGetStatusSummary"
        class="c-status-counts"
    >
        <div
            v-for="entry in statusCounts"
            :key="entry.status.key"
            class="c-status-counts__count"
            :class="entry.status.statusClass"
        >{{ entry.userCount }}</div>
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
