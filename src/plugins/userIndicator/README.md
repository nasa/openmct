# User Indicator

This plugin provides a user indicator for the top status bar that displays the user's name and role
as defined by a User Provider. A User Provider must be registered as a prerequisite for this plugin.

## Usage

To use this plugin, first register a custom User Provider with the `openmct` API, or install the example
User Provider plugin:

```javascript
openmct.install(openmct.plugins.example.ExampleUser());
```

Then, install the User Indicator plugin:

```javascript
openmct.install(openmct.plugins.UserIndicator());
```

## Configuration

The User Indicator plugin does not require any configuration.

