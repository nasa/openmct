<template>
    <div :style="position" class="c-menu" @click.stop="noop">
        <div>Current Poll Question: {{currentPollQuestion}}</div>
        <div>Current Poll Date: {{pollQuestionUpdated}}</div>
        <div>Set Poll Question:
            <input type="text" v-model="newPollQuestion" name="newPollQuestion" @change="setPollQuestion">
        </div>
        <div><button class="c-button" @click="clearAllResponses"> Clear All Responses</button></div>
    </div>
</template>

<script>
const POLL_TELEMETRY_POINT_ID = {
    namespace: 'taxonomy',
    key: '~ViperGround~OperatorStatus~PollQuestion'
};
const POLL_QUESTION_KEY = 'value';

const SET_POLL_QUESTION_URL = 'http://localhost:9000/viper-proxy/viper/yamcs/api/processors/viper/realtime/parameters/ViperGround/OperatorStatus/PollQuestion';
const CLEAR_RESPONSES_URL = 'http://localhost:9000/viper-proxy/viper/yamcs/api/processors/viper/realtime/parameters:batchSet';

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
    async mounted() {
        this.unsubscribe = [];
        this.pollQuestionTelemetryObject = await this.openmct.objects.get(POLL_TELEMETRY_POINT_ID);

        this.setMetadata();
        this.fetchCurrentPoll();
        this.subscribeToPollQuestion();
    },
    methods: {
        setMetadata() {
            const pollQuestionMetadata = openmct.telemetry.getMetadata(this.pollQuestionTelemetryObject);
            const pollQuestionMetadataValue = pollQuestionMetadata.value(POLL_QUESTION_KEY);
            const timestampMetadataValue = pollQuestionMetadata.value(this.openmct.time.timeSystem().key);

            this.timestampFormatter = openmct.telemetry.getValueFormatter(timestampMetadataValue);
            this.pollQuestionFormatter = openmct.telemetry.getValueFormatter(pollQuestionMetadataValue);
        },
        async fetchCurrentPoll() {
            const pollMessages = await this.openmct.telemetry.request(this.pollQuestionTelemetryObject, {
                strategy: 'latest',
                // TODO: THIS IS A HACK, NEED A WAY TO ALWAYS GET THE LAST VALUE FROM ANY TIME WINDOW (maybe getParameterValue()? What happens if there is nothing in the cache though (eg after a restart))
                start: 0,
                end: Date.now()
            });

            if (pollMessages.length > 0) {
                const datum = pollMessages[pollMessages.length - 1];

                this.setPollQuestionFromDatum(datum);
            }

        },
        subscribeToPollQuestion() {
            this.unsubscribe.push(this.openmct.telemetry.subscribe(this.pollQuestionTelemetryObject, (datum) => {
                this.setPollQuestionFromDatum(datum);
            }));
        },
        setPollQuestionFromDatum(datum) {
            this.currentPollQuestion = this.pollQuestionFormatter.format(datum);
            this.pollQuestionUpdated = this.timestampFormatter.format(datum);
        },
        async setPollQuestion() {
            //const response = await this.openmct.user.setPollQuestion(this.newPollQuestion);

            await fetch(SET_POLL_QUESTION_URL, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    type: 'STRING',
                    stringValue: `${this.newPollQuestion}`
                })
            });
            this.newPollQuestion = undefined;
        },
        clearAllResponses() {
            //this.openmct.user.clearAllStatuses();

            fetch(CLEAR_RESPONSES_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    request: [{
                        id: {
                            name: "/ViperGround/OperatorStatus/driverStatus",
                        },
                        value: {
                            type: 'UINT32',
                            uint32Value: '0'
                        }
                    //TODO: Also set all the other operator status parameters
                    }]
                })
            });
        },
        noop() {}
    },
    computed: {
        position() {
            return {
                position: 'absolute',
                left: `${this.positionX}px`,
                top: `${this.positionY}px`
            }
        }
    },
    beforeDestroy() {
        this.unsubscribe.forEach(unsubscribe => unsubscribe);
    }

};
</script>