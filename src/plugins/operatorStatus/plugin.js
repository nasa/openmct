/**
 * Could potentially be implemented using the User API to make this "generic" (although only supported from Yamcs initially)
 */

import OperatorStatusComponent from './OperatorStatus.vue';
//import PollQuestionComponent from './PollQuestion.vue';

import Vue from 'vue';

export default function operatorStatusPlugin(config) {
    return function install(openmct) {

        if (openmct.user.hasProvider()) {
            openmct.user.getCurrentUser().then(async currentUser => {
                const canProvideStatus = await openmct.user.canProvideStatusFor(currentUser);

                if (canProvideStatus) {
                    const operatorStatusElement = new Vue({
                        components: {
                            OperatorStatus: OperatorStatusComponent
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
                        template: '<operator-status :positionX="positionX" :positionY="positionY" />'
                    }).$mount();

                    const operatorIndicator = openmct.indicators.simpleIndicator();

                    operatorIndicator.text("My Operator Status");
                    operatorIndicator.description("Set my operator status");
                    operatorIndicator.iconClass('icon-check');
                    operatorIndicator.on('click', (event) => {
                        //Don't propagate, otherwise this event will trigger the listener below and remove itself.
                        event.stopPropagation();
                        document.body.appendChild(operatorStatusElement.$el);
                        operatorStatusElement.positionX = event.clientX;
                        operatorStatusElement.positionY = event.clientY;

                        document.addEventListener('click', () => {
                            operatorStatusElement.$el.remove();
                        }, {once: true});
                    });

                    openmct.indicators.add(operatorIndicator);
                }
            });
        }
        /**
            Operator Status
         */

        /**
            Poll Question
         */
        // const pollQuestionElement = new Vue({
        //     components: {
        //         PollQuestion: PollQuestionComponent
        //     },
        //     provide: {
        //         openmct
        //     },
        //     data() {
        //         return {
        //             positionX: 0,
        //             positionY: 0
        //         }
        //     },
        //     template: '<poll-question :positionX="positionX" :positionY="positionY" />'
        // }).$mount();

        // const pollQuestionIndicator = openmct.indicators.simpleIndicator();

        // pollQuestionIndicator.text("Poll Question");
        // pollQuestionIndicator.description("Set the current poll question");
        // pollQuestionIndicator.iconClass('icon-draft');
        // pollQuestionIndicator.on('click', (event) => {
        //     //Don't propagate, otherwise this event will trigger the listener below and remove itself.
        //     event.stopPropagation();
        //     document.body.appendChild(pollQuestionElement.$el);
        //     pollQuestionElement.positionX = event.clientX;
        //     pollQuestionElement.positionY = event.clientY;

        //     document.addEventListener('click', event => {
        //         pollQuestionElement.$el.remove();
        //     }, {once: true});
        // });

        // openmct.indicators.add(pollQuestionIndicator);
    };
};
