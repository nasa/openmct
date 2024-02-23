# User Indicator

This plugin provides a user indicator for the top status bar that displays user information as
defined by a User Provider. A User Provider must be registered as a prerequisite for this plugin.

If the User Provider supports role-based access control, the user indicator will display the user's
current role and, if the user has multiple roles, allow the user to switch between them.

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

The User Indicator plugin does not require any configuration itself.

## Mission Status

"Mission Status" is a feature that is used to indicate the current state of a mission with regards to
one or more "Mission Actions". A mission action defines a verb that may be, for example, a task 
for a spacecraft (such as "Drive" or "Imagery"), a change in the state of a ground system, or any 
other event that is relevant to the mission. Example states for a mission action might include
"Go" or "No Go", indicating whether a particular action is currently cleared for execution.

A user with the appropriate permissions may set the mission status by clicking on either the
User Indicator itself, or the "Mission Status" button next to the User Indicator. This will
open a dialog that allows the user to set the status of each mission action.

### Provider Configuration

In order to use the Mission Status feature, a registered User Provider must define the following
methods:

* `canSetMissionStatus`: A method that returns a boolean indicating whether the current user has
  permission to set the mission status.
* `getPossibleMissionActions`: A method that returns an array of mission actions that the user
  may set the status of. Each mission action should have a `key` and a `name` property.
* `getPossibleMissionActionStatuses`: A method that returns an array of `MissionStatusOption` objects,
  which define the possible statuses for each mission action.
* `getStatusForMissionAction`: A method that returns the current status for a given mission action.
* `setStatusForMissionAction`: A method that sets the status for a given mission action.

The [Example User Provider](../../../example/exampleUser/ExampleUserProvider.js) provides an example
implementation of these methods.
