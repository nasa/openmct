import Vue from 'vue';

import AbstractStatusIndicator from '../AbstractStatusIndicator';
import OperatorStatusComponent from './OperatorStatus.vue';

export default class OperatorStatusIndicator extends AbstractStatusIndicator {
    createPopupComponent() {
        const indicator = this.getIndicator();
        const popupElement = new Vue({
            components: {
                OperatorStatus: OperatorStatusComponent
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
            template: '<operator-status :positionX="positionX" :positionY="positionY" />'
        }).$mount();

        return popupElement;
    }

    createIndicator() {
        const operatorIndicator = this.openmct.indicators.simpleIndicator();

        operatorIndicator.text("My Operator Status");
        operatorIndicator.description("Set my operator status");
        operatorIndicator.iconClass('icon-status-poll-question-mark');
        operatorIndicator.element.classList.add("c-indicator--operator-status");
        operatorIndicator.element.classList.add("no-minify");
        operatorIndicator.on('click', this.showPopup);

        return operatorIndicator;
    }
}
