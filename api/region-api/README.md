# Region API - Overview

The region API provides a method for specifying which views should display in a given region for a given domain object.  As such, they also define the basic view interface that components must define.

### MCT.region.Region

The base region type, all regions implement this interface.

`register(view)`

Additionally, Regions may have subregions for different modes of the application.  Specifying a view for a region 

### MCT.region.View

The basic type for views.  You can extend this to implement your own functionality, or you can create your own object so long as it meets the interface.

`attribute` | `type` | `note`
--- | --- | ---
`label` | `string` or `Function` | The name of the view.  Used in the view selector when more than one view exists for an object.
`glyph` | `string` or `Function` | The glyph to associate with this view.  Used in the view selector when more than one view exists for an object.
`instantiate` | `Function` | constructor for a view.  Will be invoked with two arguments, `container` and `domainObject`.  It should return an object with a `destroy` method that is called when the view is removed.
`appliesTo` | `Function` | Determines if a view applies to a specific domain object.  Will be invoked with a domainObject.  Should return a number, `priority` if the view applies to a given object.  If multiple views return a truthy value for a given object, they will be ordered by priority, and the largest priority value will be the default view for the object.  Return `false` if a view should not apply to an object.

Basic Hello World:

```javascript

function HelloWorldView(container, domainObject) {
    container.innerHTML = 'Hello World!';
}

HelloWorldView.label = 'Hello World';
HelloWorldView.glyph = 'whatever';
HelloWorldView.appliesTo = function (domainObject) {
    return 10;
};

HelloWorldView.prototype.destroy = function () {
    // clean up outstanding handlers;
};

MCT.regions.Main.register(MyView);

```

## Region Hierarchy

Regions are organized in a hierarchy, with the most specific region taking precedence over less specific regions.

If you specify a view for the Main Region, it will be used for both Edit and View modes.  You can override the Main Region view for a specific mode by registering the view with that specific mode.

### MCT.regions.Tree
### MCT.regions.Main
### MCT.regions.Main.View
### MCT.regions.Main.Edit
### MCT.regions.Inspector
### MCT.regions.Inspector.View
### MCT.regions.Inspector.Edit
### MCT.regions.Toolbar
### MCT.regions.Toolbar.View
### MCT.regions.Toolbar.Edit