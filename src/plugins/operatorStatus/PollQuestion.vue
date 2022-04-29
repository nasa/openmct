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
    <div>
        <div class="c-status-count">3</div>
        <div class="c-status-count">2</div>
        <div class="c-status-count">2</div>
    </div>
    <div><button
        class="c-button"
        @click="clearAllResponses"
    > Clear All Responses</button></div>
</div>
</template>

<script>

export default {
    inject: ['openmct'],
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
            newPollQuestion: undefined
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
        },
        async updatePollQuestion() {
            await this.openmct.user.setPollQuestion(this.newPollQuestion);
            this.newPollQuestion = undefined;
        },
        clearAllResponses() {
            this.openmct.user.clearAllStatuses();
        },
        noop() {}
    }

};
</script>
