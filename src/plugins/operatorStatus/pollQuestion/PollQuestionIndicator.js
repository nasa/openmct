import Vue from 'vue';

import AbstractStatusIndicator from '../AbstractStatusIndicator';
import PollQuestionComponent from './PollQuestion.vue';

export default class PollQuestionIndicator extends AbstractStatusIndicator {
    createPopupComponent() {
        const indicator = this.getIndicator();
        const pollQuestionElement = new Vue({
            components: {
                PollQuestion: PollQuestionComponent
            },
            provide: {
                openmct: this.openmct,
                indicator: indicator
            },
            data() {
                return {
                    positionX: 0,
                    positionY: 0
                };
            },
            template: '<poll-question :positionX="positionX" :positionY="positionY" />'
        }).$mount();

        return pollQuestionElement;
    }

    createIndicator() {
        const pollQuestionIndicator = this.openmct.indicators.simpleIndicator();

        pollQuestionIndicator.text("Poll Question");
        pollQuestionIndicator.description("Set the current poll question");
        pollQuestionIndicator.iconClass('icon-status-poll-edit');
        pollQuestionIndicator.element.classList.add("c-indicator--operator-status");
        pollQuestionIndicator.element.classList.add("no-minify");
        pollQuestionIndicator.on('click', this.showPopup);

        return pollQuestionIndicator;
    }
}
