<template>
    <div :style="position" class="c-menu" @click.stop="noop">
        <div>My Role: {{role}}</div>
        <div>Current Poll Question: {{currentPollQuestion}}</div>
        <div>Current Poll Date: {{pollQuestionUpdated}}</div>
        <div>My Status: {{roleStatus}}</div>
        <div>Set Status:
            <select v-model="selectedStatus" name="setStatus" @change="setStatus">
                <option v-for="status in allStatuses" :key="status.value" :value="status.value">{{status.label}}</option>
            </select>
        </div>
    </div>
</template>

<script>
// TODO: Make this configuration
const ROLES = ['Driver'];
const POLL_TELEMETRY_POINT_ID = {
    namespace: 'taxonomy',
    key: '~ViperGround~OperatorStatus~PollQuestion'
};
const POLL_QUESTION_KEY = 'value';

const ROLE_STATUS_TELEMETRY_POINT_ID = {
    namespace: 'taxonomy',
    key: '~ViperGround~OperatorStatus~driverStatus'
};
const ROLE_STATUS_KEY = 'value';
const SET_STATUS_URL = 'http://localhost:9000/viper-proxy/viper/yamcs/api/processors/viper/realtime/parameters/ViperGround/OperatorStatus/driverStatus';
const STATUSES = [
    {
        value: 0,
        label: 'NO_STATUS'
    },{
        value: 1,
        label: 'NO_GO'
    },{
        value: 2,
        label: 'GO'
    },{
        value: 3,
        label: 'MAYBE'
    },
]

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
            role: '--',
            pollQuestionUpdated: '--',
            currentPollQuestion: '--',
            roleStatus: '--',
            selectedStatus: 'no-go',
            allStatuses: STATUSES
        };
    },
    async mounted() {
        this.unsubscribe = [];
        this.fetchAllStatuses();

        await this.fetchTelemetryObjects();
        this.setMetadata();
        this.fetchCurrentPoll();
        this.fetchMyStatus();
        this.subscribeToMyStatus();
        this.subscribeToPollQuestion();

        this.findFirstApplicableRole();
    },
    methods: {
        fetchAllStatuses() {
            //this.allStatuses = openmct.user.getAllStatuses();
        },
        async fetchTelemetryObjects() {
            const telemetryObjects = await Promise.all([
                this.openmct.objects.get(ROLE_STATUS_TELEMETRY_POINT_ID),
                this.openmct.objects.get(POLL_TELEMETRY_POINT_ID)
            ]);

            this.roleStatusTelemetryObject = telemetryObjects[0];
            this.pollQuestionTelemetryObject = telemetryObjects[1];
        },
        setMetadata() {
            const roleStatusMetadata = openmct.telemetry.getMetadata(this.roleStatusTelemetryObject);
            const roleStatusMetadataValue = roleStatusMetadata.value(ROLE_STATUS_KEY);

            const pollQuestionMetadata = openmct.telemetry.getMetadata(this.pollQuestionTelemetryObject);
            const pollQuestionMetadataValue = pollQuestionMetadata.value(POLL_QUESTION_KEY);
            
            const timestampMetadataValue = pollQuestionMetadata.value(this.openmct.time.timeSystem().key);

            this.timestampFormatter = openmct.telemetry.getValueFormatter(timestampMetadataValue);
            this.statusFormatter = openmct.telemetry.getValueFormatter(roleStatusMetadataValue);
            this.pollQuestionFormatter = openmct.telemetry.getValueFormatter(pollQuestionMetadataValue);
        },
        async findFirstApplicableRole() {
            const userRolesMap = await Promise.all(ROLES.map((role) => this.openmct.user.hasRole(role)));
            const index = userRolesMap.findIndex((hasRole) => hasRole);
            
            this.role = ROLES[index];
        },
        async fetchCurrentPoll() {
            //const pollMessage = await openmct.user.getCurrentPollQuestion();

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
        setPollQuestionFromDatum(datum) {
            this.currentPollQuestion = this.pollQuestionFormatter.format(datum);
            this.pollQuestionUpdated = this.timestampFormatter.format(datum);
        },
        async fetchMyStatus() {
            // const currentUser = this.openmct.user.getCurrentUser();
            // const status = await this.openmct.user.getStatus(currentUser);

            // TODO: Make role-specific
            const roleStatuses = await this.openmct.telemetry.request(this.roleStatusTelemetryObject, {
                strategy: 'latest',
                start: 0,
                end: Date.now()
            });

            if (roleStatuses.length > 0) {
                const datum = roleStatuses[roleStatuses.length - 1];

                this.setRoleStatusFromDatum(datum);
            }
        },
        subscribeToMyStatus() {
            // const currentUser = this.openmct.user.getCurrentUser();
            // this.openmct.user.onUserStatusChange(currentUser, this.setRoleStatus);

            this.unsubscribe.push(this.openmct.telemetry.subscribe(this.roleStatusTelemetryObject, (datum) => {
                this.setRoleStatusFromDatum(datum);
            }));
        },
        subscribeToPollQuestion() {
            this.unsubscribe.push(this.openmct.telemetry.subscribe(this.pollQuestionTelemetryObject, (datum) => {
                this.setPollQuestionFromDatum(datum);
            }));
        },
        setRoleStatusFromDatum(datum) {
            this.roleStatus = this.statusFormatter.format(datum);
            this.selectedStatus = this.findStatus(this.roleStatus);
        },
        findStatus(status) {
            return (STATUSES.find(s => s.label === status) || STATUSES[0]).value;
        },
        async setStatus(status) {
            // Where does 'status' come from. What does it look like?
            // Could be provided as an enum from the user API.

            //const result = await openmct.user.setStatus(user, status);

            // const newDatum = openmct.telemetry.newDatumFromValues(this.statusDomainObject)
            // const result = await openmct.telemetry.setValue(this.statusDomainObject, newDatum);

            const fetchResult = await fetch(SET_STATUS_URL, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    type: 'UINT32',
                    uint32Value: `${this.selectedStatus}`
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