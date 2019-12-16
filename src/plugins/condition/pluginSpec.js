import ConditionPlugin from './plugin';
import {
    createOpenMct
} from 'testTools';

describe("The condition object plugin", function () {
    let openmct;

    beforeEach(function () {
        openmct = createOpenMct();
    });

    fit('shows the object exists', () => {
        const install = new ConditionPlugin();
        install(openmct);
        const conditionType = openmct.types.get('condition');
        expect(conditionType.definition.name).toEqual('Condition');
    });
});

