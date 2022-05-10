/**
 * Could potentially be implemented using the User API to make this "generic" (although only supported from Yamcs initially)
 */

import OperatorStatusComponent from './OperatorStatus.vue';
import PollQuestionComponent from './PollQuestion.vue';

import Vue from 'vue';

export default function operatorStatusPlugin() {
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
                    operatorIndicator.on('click', () => {
                        document.body.appendChild(operatorStatusElement.$el);

                        let bb = operatorIndicator.element.getBoundingClientRect();
                        operatorStatusElement.positionX = bb.left;
                        operatorStatusElement.positionY = bb.bottom;

                        //Use capture so we don't trigger immediately on the same iteration of the event loop
                        document.addEventListener('click', clearOperatorPopup, {
                            capture: true
                        });

                        function clearOperatorPopup(clickAwayEvent) {
                            if (!operatorStatusElement.$el.contains(clickAwayEvent.target)) {
                                operatorStatusElement.$el.remove();
                                document.removeEventListener('click', clearOperatorPopup);
                            }
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

                    pollQuestionIndicator.on('click', (indicatorClickEvent) => {
                        document.body.appendChild(pollQuestionElement.$el);

                        let bb = pollQuestionIndicator.element.getBoundingClientRect();
                        pollQuestionElement.positionX = bb.left;
                        pollQuestionElement.positionY = bb.bottom;

                        document.addEventListener('click', clearPollQuestionPopup, {
                            capture: true
                        });

                        function clearPollQuestionPopup(clickAwayEvent) {
                            if (!pollQuestionElement.$el.contains(clickAwayEvent.target)) {
                                pollQuestionElement.$el.remove();
                                document.removeEventListener('click', clearPollQuestionPopup);
                            }
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
