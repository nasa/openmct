# Type API - Overview

The Type API allows you to register type information for domain objects, and allows you to retrieve type information about a given domain object.  Crucially, type information allows you to add new creatible object types.

### MCT.types.Type

The basic interface for a type.  You can extend this to implement your own type,
or you can provide an object that implements the same interface.

`attribute` | `type` | `note`
--- | --- | ---
`label` | `String` | The human readible name of the type.
`key` | `String` | The unique identifier for this type.  
`glyph` | `String` | The glyph identifier for the type.  Displayed in trees, labels, and other locations.
`description` | `String` | A basic description of the type visible in the create menu.
`isCreatible` | `Boolean`, `Number`, or `Function` | If truthy, this type will be visible in the create menu.  Note that objects not in the create menu can be instantiated via other means.
`namespace` | `String` | The object namespace that provides instances of this type.  This allows you to implement custom object providers for specific types while still utilizing other namespaces for persistence.
`properties` | `Object` | Object defining properties of an instance of this class.  Properties are used for automatic form generation and automated metadata display.  For more information on the definition of this object, look at (some resource-- jsonschema?)
`canContain` | `Function` | determins whether objects of this type can contain other objects.  Will be invoked with a domain object.  Return true to allow composition, return false to disallow composition.

### MCT.types.register(type)

Register a type with the type API.  Registering a type with the same key as another type will replace the original type definition.

### MCT.types.getType(typeKey)

Returns the type definition for a given typeKey.  returns undefined if type does not exist.

### MCT.types.getType(domainObject)

Return the type definition for a given domain object.
