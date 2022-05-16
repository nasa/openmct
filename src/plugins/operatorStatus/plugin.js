import OperatorStatusIndicator from './operatorStatus/OperatorStatusIndicator';
import PollQuestionIndicator from './pollQuestion/PollQuestionIndicator';

export default function operatorStatusPlugin() {
    return function install(openmct) {

        if (openmct.user.hasProvider()) {
            openmct.user.status.canProvideStatusForCurrentUser().then(canProvideStatus => {
                if (canProvideStatus) {
                    const operatorStatusIndicator = new OperatorStatusIndicator(openmct);

                    operatorStatusIndicator.install();
                }
            });

            openmct.user.status.canSetPollQuestion().then(canSetPollQuestion => {
                if (canSetPollQuestion) {
                    const pollQuestionIndicator = new PollQuestionIndicator(openmct);

                    pollQuestionIndicator.install();
                }
            });
        }
    };
}
