This bundle introduces the notion of "representations" to Open MCT Web,
primarily via an Angular directive, `mct-representation`.

A representation is used to display domain objects as Angular templates.

# Extension Categories

This bundle introduces four new categories of extension:

* `templates`: Reusable Angular templates. This category of extension is
  present to support the `mct-include` directive, which in turn is present
  to allow templates to be loaded from across bundles, without knowing
  their path ahead of time. A template has the following fields:
    * `key`: The machine-readable name which identifies this template,
      matched against the value given to the `key` attribute of the
      `mct-include` directive.
    * `templateUrl`: The path to the relevant Angular template. This
      path is relative to the bundle's resources directory.
* `representations`: Ways of representing a domain object. A representation
  is defined with the following fields:
    * `key`: The machine-readable name which identifies the representation.
    * `templateUrl`: The path to the representation's Angular template. This
      path is relative to the bundle's resources directory.
    * `uses`: An array of capability names. Indicates that this representation
      intends to use those capabilities of a domain object (via a
      `useCapability` call), and expects to find the latest results of
      that `useCapability` call in the scope of the presented template (under
      the same name as the capability itself.)
    * `gestures`: An array of keys identifying gestures which should be
      available upon this representation. Examples of gestures include
      "drag" (for representations that should act as draggable sources
      for drag-drop operations) and "menu" (for representations which
      should show a domain-object-specific context menu on right-click.)
* `views`: A view is a representation with a visible identity to the user
  (e.g. something they can switch among in the view menu.) A view
  supports the same fields as a representation, and additionally:
    * `name`: The human-readable name of the view.
    * `glyph`: A character to display as an icon for this view.
    * `description`: The human-readable description of the view.
* `gestures`: A gesture is a user action which can be taken upon a
  representation of a domain object. Gestures are described by:
    * `key`: The machine-readable name used to look up the gesture.
    * `implementation`: The class (relative to the bundle's sources
    directory) which implements the gesture. This is instantiated once
    per representation that uses the gesture. This class will
    receive the jqLite-wrapped `mct-representation` element and the
    domain object being represented as arguments, and should do any
    necessary "wiring" (e.g. listening for events) during its
    constructor call. This class may also expose an optional `destroy()`
    method which should be called when the gesture should be removed,
    to avoid memory leaks by way of unremoved listeners.


# Extensions

## Directives

* `mct-include`: Includes a template by symbolic key; used to augment the
  capability of Angular's `ng-include`, which loads templates by path.
  Takes three attributes as Angular expressions:
    * `key`: The symbolic identifier of the template to load, matched
      against keys defined in extensions of category `templates`.
      Note that this is an Angular expression, so internal quotes
      may be necessary (see documentation of `ng-include`, which has the same
      "gotcha" for URLs.)
    * `ng-model`: Optional (and not often used); a model which should appear
      in the included template's scope, for it to modify. The specific
      interpretation of this attribute will vary depending on the included
      template.
    * `parameters`: Optional (and not often used); as `ng-model`, except the
      intent is to provide information about how to display the included
      template (e.g. "title", "color"). The specific interpretation of
      this attribute will vary depending on the included template.
* `mct-representation`: Similar to `mct-include`, except the template to
  include is specifically a representation of a domain object.
    * `key`: As used in `mct-include`, except it will refer to an extension
      or category `representations` or of `views`.
    * `mct-object`: An Angular expression; the domain object to be
      represented.
    * `parameters`: As defined for `mct-include`.

### Examples

    <mct-include key="'status-bar'"></mct-include>
    <mct-representation key="'grid-item'"></mct-representation>

    <mct-include key="'title-bar'"
                 parameters="{title: 'Hello', tooltip: 'Hello, world.'}">
    </mct-include>


## Components

* `gestureService`: A provider of type `gestureService` is included to
  remove the need to depend on `gestures[]` directly; instead, the
  gesture service can be used to add/remove gestures in groups. This is
  present primarily for bundle-internal use (it is used by the
  `mct-representation` directive) but it is exposed as a service component
  for convenience.

## Gestures

In addition to introducing `gestures` as a category of extension, this bundle
introduces three specific gestures as "built in" options, listed by key:

* `drag`: Representations with this gesture can serve as drag sources for
  drag-drop domain object composition.
* `drop`: Representations with this gesture can serve as drop targets for
  drag-drop domain object composition.
  * When a drop occurs, an `mctDrop` event will be broadcast with two
  arguments (in addition to Angular's event object): The domain object
  identifier for the dropped object, and the position (with `x` and `y`
  properties in pixels) of the drop, relative to the top-left of the
  representation which features the drop gesture.
* `menu`: Representations with this gesture will provide a custom context
  menu (instead of the browser default).
  * It should be noted that this gesture does _not_ define the appearance
  or functionality of this menu; rather, it simply adds a
  representation of key `context-menu` to the document at an appropriate
  location. This representation will be supplied by the commonUI bundle.