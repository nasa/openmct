# Open MCT API

The Open MCT framework public api can be utilized by building the application
(`gulp install`) and then copying the file from `dist/main.js` to your
directory of choice.

Open MCT supports AMD, CommonJS, and loading via a script tag; it's easy to use
in your project. The [`openmct`]{@link module:openmct} module is exported
via AMD and CommonJS, and is also exposed as `openmct` in the global scope
if loaded via a script tag.

## Overview

Open MCT's goal is to allow you to browse, create, edit, and visualize all of
the domain knowledge you need on a daily basis.

To do this, the main building block provided by Open MCT is the _domain object_.
The temperature sensor on the starboard solar panel,
an overlay plot comparing the results of all temperature sensor,
the command dictionary for a spacecraft,
the individual commands in that dictionary, your "my documents" folder:
All of these things are domain objects.

Domain objects have Types, so a specific instrument temperature sensor is a
"Telemetry Point," and turning on a drill for a certain duration of time is
an "Activity".  Types allow you to form an ontology of knowledge and provide
an abstraction for grouping, visualizing, and interpreting data.

And then we have Views. Views allow you to visualize domain objects. Views can
apply to specific domain objects; they may also apply to certain types of
domain objects, or they may apply to everything.  Views are simply a method
of visualizing domain objects.

Regions allow you to specify what views are displayed for specific types of
domain objects in response to different user actions. For instance, you may
want to display a different view while editing, or you may want to update the
toolbar display when objects are selected.  Regions allow you to map views to
specific user actions.

Domain objects can be mutated and persisted, developers can create custom
actions and apply them to domain objects, and many more things can be done.
For more information, read on!


