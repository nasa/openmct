<template>
<div
    :style="position"
    class="c-menu"
    @click.stop="noop"
>
    <div>My Role: {{ role }}</div>
    <div>Current Poll Question: {{ currentPollQuestion }}</div>
    <div>Current Poll Date: {{ pollQuestionUpdated }}</div>
    <div>My Status: {{ roleStatus }}</div>
    <div>Set Status:
        <select
            v-model="selectedStatus"
            name="setStatus"
            @change="changeStatus"
        >
            <option
                v-for="status in allStatuses"
                :key="status.value"
                :value="status.value"
            >
                {{ status.label }}
            </option>
        </select>
    </div>
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
        this.openmct.user.off('roleStatusChange', this.setStatus);
        this.openmct.user.off('pollQuestionChange', this.setPollQuestion);
    },
    async mounted() {
        this.unsubscribe = [];
        await this.findFirstApplicableRole();
        this.fetchCurrentPoll();
        this.fetchMyStatus();
        this.subscribeToMyStatus();
        this.subscribeToPollQuestion();
    },
    methods: {
        async findFirstApplicableRole() {
            const rolesWithStatusForUser = await this.openmct.user.getStatusRolesForUser(this.user);

            this.role = rolesWithStatusForUser[0];
        },
        async fetchCurrentPoll() {
            const pollQuestion = await this.openmct.user.getPollQuestion();

            this.setPollQuestion(pollQuestion);
        },
        setPollQuestion(pollQuestion) {
            this.currentPollQuestion = pollQuestion.question;
            this.pollQuestionUpdated = pollQuestion.timestamp;
        },
        async fetchMyStatus() {
            const status = await this.openmct.user.getRoleStatus(this.role);

            this.setStatus(status);
        },
        subscribeToMyStatus() {
            this.openmct.user.on('roleStatusChange', this.setStatus);
        },
        subscribeToPollQuestion() {
            this.openmct.user.on('pollQuestionChange', this.setPollQuestion);
        },
        setStatus(status) {
            this.roleStatus = status.label;
            this.selectedStatus = status.key;
        },
        async changeStatus(status) {
            const result = await this.openmct.user.setRoleStatus(this.role, status);

            return result;
        },
        noop() {}
    }
};
</script>
