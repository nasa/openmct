import TableConfigurationViewProvider from '../telemetryTable/TableConfigurationViewProvider';

export default function LADTableConfigurationViewProvider(openmct) {
    // extends TableConfigurationViewProvider and change type to LadTable
    let tableConfiguration = new TableConfigurationViewProvider(openmct);
    tableConfiguration.canView = function (selection) {
        if (selection.length !== 1 || selection[0].length === 0) {
            return false;
        }

        let object = selection[0][0].context.item;

        return object && object.type === 'LadTable';
    };

    return tableConfiguration;
}
