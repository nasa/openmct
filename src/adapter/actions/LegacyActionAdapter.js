export default function LegacyActionAdapter(openmct, legacyActions) {
    function contextCategoryOnly(action) {
        return action.category === 'contextual';
    }

    function createContextMenuAction(LegacyAction) {
        return {
            name: LegacyAction.definition.name,
            description: LegacyAction.definition.description,
            cssClass: LegacyAction.definition.cssClass,
            appliesTo(objectPath) {
                let legacyObject = openmct.legacyObject(objectPath);
                return LegacyAction.appliesTo({
                    domainObject: legacyObject
                });
            },
            invoke(objectPath) {
                let context = {
                    category: 'contextual',
                    domainObject: openmct.legacyObject(objectPath)
                }
                let legacyAction = new LegacyAction(context);

                if (!legacyAction.getMetadata) {
                    let metadata = Object.create(LegacyAction.definition);
                    metadata.context = context;
                    legacyAction.getMetadata = function () {
                        return metadata;
                    }.bind(legacyAction);
                }
                legacyAction.perform();
            }
        }
    }

    legacyActions.filter(contextCategoryOnly)
        .map(createContextMenuAction)
        .forEach(openmct.contextMenu.registerAction);
}
