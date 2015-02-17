Contains sources and resources associated with Edit mode.

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
* `inclusive`: Optional; true if this control should be considered
  applicable whenever at least one element in the selection has
  the associated property. Otherwise, all members of the current
  selection must have this property for the control to be shown.

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

