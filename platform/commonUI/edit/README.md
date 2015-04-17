Contains sources and resources associated with Edit mode.

# Extensions

## Directives

This bundle introduces the `mct-before-unload` directive, primarily for
internal use (to prompt the user to confirm navigation away from unsaved
changes in Edit mode.)

The `mct-before-unload` directive is used as an attribute whose value is
an Angular expression that is evaluated when navigation changes (either
via browser-level changes, such as the refresh button, or changes to
the Angular route, which happens when hitting the back button in Edit
mode.) The result of this evaluation, when truthy, is shown in a browser
dialog to allow the user to confirm navigation. When falsy, no prompt is
shown, allowing these dialogs to be shown conditionally. (For instance, in
Edit mode, prompts are only shown if user-initiated changes have
occurred.)

This directive may be attached to any element; its behavior will be enforced
so long as that element remains within the DOM.

# Toolbars

Views may specify the contents of a toolbar through a `toolbar`
property in their bundle definition. This should appear as the
structure one would provide to the `mct-toolbar` directive,
except additional properties are recognized to support the
mediation between toolbar contents, user interaction, and the
current selection (as read from the `selection` property of the
view's scope.) These additional properties are:

* `property`: Name of the property within a selected object. If,
  for any given object in the selection, that field is a function,
  then that function is assumed to be an accessor-mutator function
  (that is, it will be called with no arguments to get, and with
  an argument to set.)
* `method`: Name of a method to invoke upon a selected object when
  a control is activated, e.g. on a button click.
* `exclusive`: Optional; true if this control should be considered
  applicable only when all elements in the selection has
  the associated property. Otherwise, only at least one member of the
  current selection must have this property for the control to be shown.

Controls in the toolbar are shown based on applicability to the
current selection. Applicability for a given member of the selection
is determined by the presence of absence of the named `property`
field. As a consequence of this, if `undefined` is a valid value for
that property, an accessor-mutator function must be used. Likewise,
if toolbar properties are meant to be view-global (as opposed to
per-selection) then the view must include some object to act as its
proxy in the current selection (in addition to whatever objects the
user will conceive of as part of the current selection), typically
with `inclusive` set to `true`.

## Selection

The `selection` property of a view's scope in Edit mode will be
initialized to an empty array. This array's contents may be modified
to implicitly change the contents of the toolbar based on the rules
described above. Care should be taken to modify this array in-place
instead of shadowing it (as the selection will typically
be a few scopes up the hierarchy from the view's actual scope.)
