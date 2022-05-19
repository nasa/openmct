<!--
 Open MCT, Copyright (c) 2014-2022, United States Government
 as represented by the Administrator of the National Aeronautics and Space
 Administration. All rights reserved.

 Open MCT is licensed under the Apache License, Version 2.0 (the
 "License"); you may not use this file except in compliance with the License.
 You may obtain a copy of the License at
 http://www.apache.org/licenses/LICENSE-2.0.

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 License for the specific language governing permissions and limitations
 under the License.

 Open MCT includes source code licensed under additional open source
 licenses. See the Open Source Licenses file (LICENSES.md) included with
 this source code distribution or the Licensing information page available
 at runtime from the About dialog for additional information.
-->
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

        <template v-if="statusCountViewModel.length > 0">
            <div class="c-spq__label">Reporting:</div>
            <div class="c-spq__value c-status-poll-panel__poll-reporting c-status-poll-report">
                <div
                    v-for="entry in statusCountViewModel"
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
                        {{ entry.roleCount }}
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
    inject: ['openmct', 'indicator', 'configuration'],
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
            statusCountViewModel: []
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
        this.fetchCurrentPoll();
        this.subscribeToPollQuestion();
        this.fetchStatusSummary();
        this.openmct.user.status.on('statusChange', this.fetchStatusSummary);
    },
    beforeDestroy() {
        this.openmct.user.status.off('statusChange', this.fetchStatusSummary);
        this.openmct.user.status.off('pollQuestionChange', this.setPollQuestion);
    },
    methods: {
        async fetchCurrentPoll() {
            const pollQuestion = await this.openmct.user.status.getPollQuestion();
            if (pollQuestion !== undefined) {
                this.setPollQuestion(pollQuestion);
            }
        },
        subscribeToPollQuestion() {
            this.openmct.user.status.on('pollQuestionChange', this.setPollQuestion);
        },
        setPollQuestion(pollQuestion) {
            this.currentPollQuestion = pollQuestion.question;
            this.pollQuestionUpdated = new Date(pollQuestion.timestamp).toISOString();
            this.indicator.text(pollQuestion.question);
        },
        async updatePollQuestion() {
            const result = await this.openmct.user.status.setPollQuestion(this.newPollQuestion);
            if (result === true) {
                this.openmct.notifications.info("Successfully set new poll question");
            } else {
                this.openmct.notifications.error("Unable to set new poll question.");
            }

            this.newPollQuestion = undefined;
        },
        async fetchStatusSummary() {
            const allStatuses = await this.openmct.user.status.getPossibleStatuses();
            const statusCountMap = allStatuses.reduce((statusToCountMap, status) => {
                statusToCountMap[status.key] = 0;

                return statusToCountMap;
            }, {});
            const allStatusRoles = await this.openmct.user.status.getAllStatusRoles();
            const statusesForRoles = await Promise.all(allStatusRoles.map(role => this.openmct.user.status.getStatusForRole(role)));

            statusesForRoles.forEach((status, i) => {
                const currentCount = statusCountMap[status.key];
                statusCountMap[status.key] = currentCount + 1;
            });

            this.statusCountViewModel = allStatuses.map((status) => {
                return {
                    status: this.applyStyling(status),
                    roleCount: statusCountMap[status.key]
                };
            });
        },
        applyStyling(status) {
            const stylesForStatus = this.configuration?.statusStyles?.[status.label];

            if (stylesForStatus !== undefined) {
                return {
                    ...status,
                    ...stylesForStatus
                };
            } else {
                return status;
            }
        },
        noop() {}
    }

};
</script>
