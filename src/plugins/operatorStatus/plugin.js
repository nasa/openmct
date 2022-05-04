/**
 * Could potentially be implemented using the User API to make this "generic" (although only supported from Yamcs initially)
 */

import OperatorStatusComponent from './OperatorStatus.vue';
import PollQuestionComponent from './PollQuestion.vue';

import Vue from 'vue';

export default function operatorStatusPlugin(config) {
    return function install(openmct) {

        if (openmct.user.hasProvider()) {
            openmct.user.canProvideStatus().then(canProvideStatus => {
                if (canProvideStatus) {
                    let operatorStatusElement;

                    const operatorIndicator = openmct.indicators.simpleIndicator();

                    operatorIndicator.text("My Operator Status");
                    operatorIndicator.description("Set my operator status");
                    operatorIndicator.iconClass('icon-check');
                    operatorIndicator.element.classList.add("no-minify");
                    operatorIndicator.on('click', (event) => {
                        let triggeredByThisIndicator = true;

                        document.body.appendChild(operatorStatusElement.$el);
                        operatorStatusElement.positionX = event.clientX;
                        operatorStatusElement.positionY = event.clientY;

                        document.addEventListener('click', clearOperatorPopup);

                        function clearOperatorPopup() {
                            if (!triggeredByThisIndicator) {
                                operatorStatusElement.$el.remove();
                                document.removeEventListener('click', clearOperatorPopup);
                            }

                            triggeredByThisIndicator = false;
                        }
                    });

                    openmct.indicators.add(operatorIndicator);

                    operatorStatusElement = new Vue({
                        components: {
                            OperatorStatus: OperatorStatusComponent
                        },
                        provide: {
                            openmct,
                            indicator: operatorIndicator
                        },
                        data() {
                            return {
                                positionX: 0,
                                positionY: 0
                            };
                        },
                        template: '<operator-status :positionX="positionX" :positionY="positionY" />'
                    }).$mount();
                }
            });

            openmct.user.canSetPollQuestion().then(canSetPollQuestion => {
                if (canSetPollQuestion) {
                    let pollQuestionElement;

                    const pollQuestionIndicator = openmct.indicators.simpleIndicator();

                    pollQuestionIndicator.text("Poll Question");
                    pollQuestionIndicator.description("Set the current poll question");
                    pollQuestionIndicator.iconClass('icon-draft');
                    pollQuestionIndicator.element.classList.add("no-minify");

                    pollQuestionIndicator.on('click', (event) => {
                        //Don't propagate, otherwise this event will trigger the listener below and remove itself.
                        let triggeredByThisIndicator = true;

                        document.body.appendChild(pollQuestionElement.$el);
                        pollQuestionElement.positionX = event.clientX;
                        pollQuestionElement.positionY = event.clientY;

                        document.addEventListener('click', clearPollQuestionPopup);

                        function clearPollQuestionPopup() {
                            if (!triggeredByThisIndicator) {
                                pollQuestionElement.$el.remove();
                                document.removeEventListener('click', clearPollQuestionPopup);
                            }

                            triggeredByThisIndicator = false;
                        }
                    });

                    openmct.indicators.add(pollQuestionIndicator);

                    pollQuestionElement = new Vue({
                        components: {
                            PollQuestion: PollQuestionComponent
                        },
                        provide: {
                            openmct,
                            indicator: pollQuestionIndicator
                        },
                        data() {
                            return {
                                positionX: 0,
                                positionY: 0
                            };
                        },
                        template: '<poll-question :positionX="positionX" :positionY="positionY" />'
                    }).$mount();
                }
            });
        }
    };
}
