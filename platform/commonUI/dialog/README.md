This bundle provides `dialogService`, which can be used to prompt
for user input.

## `getUserChoice`

The `getUserChoice` method is useful for displaying a message and a set of
buttons. This method returns a promise which will resolve to the user's
chosen option (or, more specifically, its `key`), and will be rejected if
the user closes the dialog with the X in the top-right;

The `dialogModel` given as an argument to this method should have the
following properties.

* `title`: The title to display at the top of the dialog.
* `hint`: Short message to display below the title.
* `template`: Identifying key (as will be passed to `mct-include`) for
  the template which will be used to populate the inner area of the dialog.
* `model`: Model to pass in the `ng-model` attribute of
  `mct-include`.
* `parameters`: Parameters to pass in the `parameters` attribute of
  `mct-include`.
* `options`: An array of options describing each button at the bottom.
  Each option may have the following properties:
  * `name`: Human-readable name to display in the button.
  * `key`: Machine-readable key, to pass as the result of the resolved
   promise when clicked.
  * `description`: Description to show in tool tip on hover.