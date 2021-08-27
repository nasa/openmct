import AutoCompleteField from './components/controls/AutoCompleteField.vue';
import ClockDisplayFormatField from './components/controls/ClockDisplayFormatField.vue';
import Datetime from './components/controls/Datetime.vue';
import FileInput from './components/controls/FileInput.vue';
import Locator from './components/controls/Locator.vue';
import NumberField from './components/controls/NumberField.vue';
import SelectField from './components/controls/SelectField.vue';
import TextAreaField from './components/controls/TextAreaField.vue';
import TextField from './components/controls/TextField.vue';

export const DEFAULT_CONTROLS_MAP = {
    'autocomplete': AutoCompleteField,
    'composite': ClockDisplayFormatField,
    'datetime': Datetime,
    'file-input': FileInput,
    'locator': Locator,
    'numberfield': NumberField,
    'select': SelectField,
    'textarea': TextAreaField,
    'textfield': TextField
};

export default class FormControl {
    constructor(openmct) {
        this.openmct = openmct;
        this.controls = {};

        this._addDefaultFormControls();
    }

    addControl(controlName, controlViewProvider) {
        const control = this.controls[controlName];
        if (control) {
            this.openmct.notifications.error(`Error: provided form control '${controlName}', already exists`);

            return;
        }

        this.controls[controlName] = controlViewProvider;
    }

    getControl(controlName) {
        const control = this.controls[controlName];
        if (!control) {
            console.error(`Error: form control '${controlName}', does not exist`);
        }

        return control;
    }

    /**
     * @private
     */
    _addDefaultFormControls() {
        Object.keys(DEFAULT_CONTROLS_MAP).forEach(control => {
            const controlViewProvider = this._getControlViewProvider(control);
            this.addControl(control, controlViewProvider);
        });
    }

    /**
     * @private
     */
    _getControlViewProvider(control) {
        return {
            show() {
                return DEFAULT_CONTROLS_MAP[control];
            }
        };
    }
}

