<template>
<div
    :style="position"
    class="c-menu"
    @click.stop="noop"
>
    <div>Current Poll Question: {{ currentPollQuestion }}</div>
    <div>Current Poll Date: {{ pollQuestionUpdated }}</div>
    <div>Set Poll Question:
        <input
            v-model="newPollQuestion"
            type="text"
            name="newPollQuestion"
            @change="updatePollQuestion"
        >
    </div>
    <div v-if="canGetStatusSummary">
        <div
            v-for="entry in statusCounts"
            :key="entry[0]"
            class="c-status-count"
        >{{ entry[1] }}</div>
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
    async mounted() {
        this.unsubscribe = [];
        this.fetchCurrentPoll();
        this.subscribeToPollQuestion();
        this.canGetStatusSummary = await this.openmct.user.canGetUsersByStatus();
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
                return this.openmct.user.getUsersByStatus(status);
            }));
            const statusToUserCountMap = allStatuses.reduce((map, status, index) => {
                map[status] = usersByStatus[index].length;

                return map;
            }, {});

            this.statusCounts = statusToUserCountMap.entries();
        },
        clearAllResponses() {
            this.openmct.user.clearAllStatuses();
        },
        noop() {}
    }

};
</script>
