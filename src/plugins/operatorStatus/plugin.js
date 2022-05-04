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
                    operatorIndicator.on('click', (event) => {
                        //Don't propagate, otherwise this event will trigger the listener below and remove itself.
                        document.body.appendChild(operatorStatusElement.$el);
                        operatorStatusElement.positionX = event.clientX;
                        operatorStatusElement.positionY = event.clientY;

                        document.addEventListener('click', () => {
                            operatorStatusElement.$el.remove();
                        }, {
                            once: true,
                            // Use the capture phase so this doesn't get triggered in the same event loop iteration as the indicator's onClick
                            capture: true
                        });
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
                    pollQuestionIndicator.on('click', (event) => {
                        //Don't propagate, otherwise this event will trigger the listener below and remove itself.
                        document.body.appendChild(pollQuestionElement.$el);
                        pollQuestionElement.positionX = event.clientX;
                        pollQuestionElement.positionY = event.clientY;

                        document.addEventListener('click', () => {
                            pollQuestionElement.$el.remove();
                        }, {
                            once: true,
                            // Use the capture phase so this doesn't get triggered in the same event loop iteration as the indicator's onClick
                            capture: true
                        });
                    });

                    openmct.indicators.add(pollQuestionIndicator);

                    pollQuestionElement = new Vue({
                        components: {
                            PollQuestion: PollQuestionComponent
                        },
                        provide: {
                            openmct
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
