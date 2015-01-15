# Overview

This bundle contains a general implementation of forms in Open MCT Web.
This allows forms to be expressed using a reasonably concise declarative
syntax, and rendered as Angular templates in a consistent fashion.

# Usage

To include a form with a declarative definition, use the `mct-form`
directive, e.g.:

    <mct-form ng-model="myModel" structure="myStructure" name="myForm">
    </mct-form>

Using toolbars is similar:

    <mct-toolbar ng-model="myModel" structure="myStructure" name="myToolbar">
    </mct-toolbar>

The attributes utilized by this form are as follows:

* `ng-model`: The object which should contain the full form input. Individual
  fields in this model are bound to individual controls; the names used for
  these fields are provided in the form structure (see below).
* `structure`: The structure of the form; e.g. sections, rows, their names,
  and so forth. The value of this attribute should be an Angular expression.
* `name`: The name in the containing scope under which to publish form
  "meta-state", e.g. `$valid`, `$dirty`, etc. This is as the behavior of
  `ng-form`. Passed as plain text in the attribute.

## Form structure

A form's structure is described as a JavaScript object in the following form:

    {
        "name": ... title to display for the form, as a string ...,
        "sections": [
            {
                "name": ... title to display for the section ...,
                "rows": [
                    {
                        "name": ... title to display for this row ...,
                        "control": ... symbolic key for the control ...,
                        "key": ... field name in ng-model ...
                        "pattern": ... optional, reg exp to match against ...
                        "required": ... optional boolean ...
                        "options": [
                            "name": ... name to display (e.g. in a select) ...,
                            "value": ... value to store in the model ...
                        ]
                    },
                    ... and other rows ...
                ]
            },
            ... and other sections ...
        ]
    }

Note that `pattern` may be specified as a string, to simplify storing
for structures as JSON when necessary. The string should be given in
a form appropriate to pass to a `RegExp` constructor.

## Toolbar structure

A toolbar's structure is described similarly to forms, except that there
is no notion of rows; instead, there are `items`.

    {
        "name": ... title to display for the form, as a string ...,
        "sections": [
            {
                "name": ... title to display for the section ...,
                "items": [
                    {
                        "name": ... title to display for this row ...,
                        "control": ... symbolic key for the control ...,
                        "key": ... field name in ng-model ...
                        "pattern": ... optional, reg exp to match against ...
                        "required": ... optional boolean ...
                        "options": [
                            "name": ... name to display (e.g. in a select) ...,
                            "value": ... value to store in the model ...
                        ],
                        "disabled": ... true if control should be disabled ...
                        "size": ... size of the control (for textfields) ...
                        "click": ... function to invoke (for buttons) ...
                        "glyph": ... glyph to display (for buttons) ...
                        "text": ... text withiin control (for buttons) ...
                    },
                    ... and other rows ...
                ]
            },
            ... and other sections ...
        ]
    }

Note that `pattern` may be specified as a string, to simplify storing
for structures as JSON when necessary. The string should be given in
a form appropriate to pass to a `RegExp` constructor.

## Adding controls

Four standard control types are included in the forms bundle:

* `textfield`: An area to enter plain text.
* `select`: A drop-down list of options.
* `checkbox`: A box which may be checked/unchecked.
* `color`: A color picker.
* `button`: A button.
* `datetime`: An input for UTC date/time entry; gives result as a
  UNIX timestamp, in milliseconds since start of 1970, UTC.

New controls may be added as extensions of the `controls` category.
Extensions of this category have two properites:

* `key`: The symbolic name for this control (matched against the
  `control` field in rows of the form structure).
* `templateUrl`: The URL to the control's Angular template, relative
  to the resources directory of the bundle which exposes the extension.

Within the template for a control, the following variables will be
included in scope:

* `ngModel`: The model where form input will be stored. Notably we
  also need to look at `field` (see below) to determine which field
  in the model should be modified.
* `ngRequired`: True if input is required.
* `ngPattern`: The pattern to match against (for text entry.)
* `options`: The options for this control, as passed from the
  `options` property of an individual row.
* `field`: Name of the field in `ngModel` which will hold the value
  for this control.