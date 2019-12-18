import { createOpenMct } from "testTools";
import ConditionPlugin from "./plugin";

let openmct;
let conditionDefinition;
let mockDomainObject;

let mockConditionObject = {
    name: 'Condition',
    key: 'condition',
    creatable: false
};

describe('the plugin', function () {

    beforeEach(() => {
        openmct = createOpenMct();
        openmct.install(new ConditionPlugin());
        conditionDefinition = openmct.types.get('condition').definition;
    });

    it('defines an object type with the correct key', () => {
        expect(conditionDefinition.key).toEqual(mockConditionObject.key);
    });

    it('is not creatable', () => {
        expect(conditionDefinition.creatable).toEqual(mockConditionObject.creatable);
    });

    describe('the object', () => {
        beforeEach(() => {
            mockDomainObject = {
                identifier: {
                    key: 'testConditionKey',
                    namespace: ''
                },
                type: 'condition'
            };

            conditionDefinition.initialize(mockDomainObject);
        });

        it('initializes with an empty composition list', () => {
            expect(mockDomainObject.composition instanceof Array).toBeTrue();
            expect(mockDomainObject.composition.length).toEqual(0);
        });
    });
});
