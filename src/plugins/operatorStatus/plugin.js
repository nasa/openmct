import OperatorStatusComponent from './OperatorStatus.vue';
import PollQuestionComponent from './PollQuestion.vue';

import Vue from 'vue';

export default function operatorStatusPlugin() {
    return function install(openmct) {

        if (openmct.user.hasProvider()) {
            openmct.user.status.canProvideStatusForCurrentUser().then(canProvideStatus => {
                if (canProvideStatus) {
                    let operatorStatusElement;

                    const operatorIndicator = openmct.indicators.simpleIndicator();

                    operatorIndicator.text("My Operator Status");
                    operatorIndicator.description("Set my operator status");
                    operatorIndicator.iconClass('icon-status-poll-question-mark');
                    operatorIndicator.element.classList.add("c-indicator--operator-status");
                    operatorIndicator.element.classList.add("no-minify");
                    operatorIndicator.on('click', () => {
                        document.body.appendChild(operatorStatusElement.$el);
                        //Use capture so we don't trigger immediately on the same iteration of the event loop
                        document.addEventListener('click', clearOperatorPopup, {
                            capture: true
                        });

                        const positionBox = throttle(() => {
                            let indicatorBox = operatorIndicator.element.getBoundingClientRect();
                            operatorStatusElement.positionX = indicatorBox.left;
                            operatorStatusElement.positionY = indicatorBox.bottom;

                            const popupRight = operatorStatusElement.positionX + operatorStatusElement.$el.clientWidth;
                            const offsetLeft = Math.min(window.innerWidth - popupRight, 0);
                            operatorStatusElement.positionX = operatorStatusElement.positionX + offsetLeft;
                        });

                        positionBox();
                        window.addEventListener('resize', positionBox);

                        function clearOperatorPopup(clickAwayEvent) {
                            if (!operatorStatusElement.$el.contains(clickAwayEvent.target)) {
                                operatorStatusElement.$el.remove();
                                document.removeEventListener('click', clearOperatorPopup);
                                window.removeEventListener('resize', positionBox);
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

            openmct.user.status.canSetPollQuestion().then(canSetPollQuestion => {
                if (canSetPollQuestion) {
                    let pollQuestionElement;

                    const pollQuestionIndicator = openmct.indicators.simpleIndicator();

                    pollQuestionIndicator.text("Poll Question");
                    pollQuestionIndicator.description("Set the current poll question");
                    pollQuestionIndicator.iconClass('icon-status-poll-edit');
                    pollQuestionIndicator.element.classList.add("c-indicator--operator-status");
                    pollQuestionIndicator.element.classList.add("no-minify");

                    pollQuestionIndicator.on('click', () => {
                        document.body.appendChild(pollQuestionElement.$el);

                        document.addEventListener('click', clearPollQuestionPopup, {
                            capture: true
                        });

                        const positionBox = throttle(() => {
                            const indicatorBoundingBox = pollQuestionIndicator.element.getBoundingClientRect();
                            pollQuestionElement.positionX = indicatorBoundingBox.left;
                            pollQuestionElement.positionY = indicatorBoundingBox.bottom;

                            const popupRight = pollQuestionElement.positionX + pollQuestionElement.$el.clientWidth;
                            const offsetLeft = Math.min(window.innerWidth - popupRight, 0);
                            pollQuestionElement.positionX = pollQuestionElement.positionX + offsetLeft;
                        });

                        positionBox();
                        window.addEventListener('resize', positionBox);

                        function clearPollQuestionPopup(clickAwayEvent) {
                            if (!pollQuestionElement.$el.contains(clickAwayEvent.target)) {
                                pollQuestionElement.$el.remove();
                                document.removeEventListener('click', clearPollQuestionPopup);
                                window.removeEventListener('resize', positionBox);
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

        function throttle(callback) {
            let rendering = false;

            return () => {
                if (!rendering) {
                    rendering = true;

                    requestAnimationFrame(() => {
                        callback();
                        rendering = false;
                    });
                }
            };
        }
    };
}
