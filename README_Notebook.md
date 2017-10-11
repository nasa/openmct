# NASA - OPEN MCT NOTEBOOK UI PROTOTYPE CHALLENGE

UI Prototype Competition

https://www.topcoder.com/challenge-details/30059614/

Heroku Implementation: http://nasa-mct-notebook.herokuapp.com/

Notebooks are a new domain object that allows users to create and edit timestamped text entries that also include snapshots of timestamped domain objects.

To build locally please follow the steps and requirements for the official openmct project:

## Building and Running Open MCT Locally

Building and running Open MCT in your local dev environment is very easy. Be sure you have [Git](https://git-scm.com/downloads) and [Node.js](https://nodejs.org/) installed, then follow the directions below. Need additional information? Check out the [Getting Started](https://nasa.github.io/openmct/getting-started/) page on our website.
(These instructions assume you are installing as a non-root user; developers have [reported issues](https://github.com/nasa/openmct/issues/1151) running these steps with root privileges.)

1. Install development dependencies

 `npm install`

2. Run a local development server

 `npm start`

Open MCT is now running, and can be accessed by pointing a web browser at [http://localhost:8080/](http://localhost:8080/)

The current styles were made according with the visuals handled by the project, in fact a lot of classes (styles) were reused.

In order to persist in localstorage some changes made to the notebook is necessary to save the current state of the view, this for compatibility and familiarity with the behaviour of the rest of the mct components.

Since the snapshots are taken from the dom representation of the components it depends of the implementation of the project, where are some components which can take longer to display, or not display at all if they are not selected.

The notebook should work as a standalone plugin, you just need to put the folder 'notebook' at the examples folder and make the require to it in the index.html.

The Old API was used due to the documentation was more thorought.

#How to use it:
Click on the create menu button at the left top corner of the creen and create a notebook object.
After you saved it you can start to create new entries, either clicking inside of the drag area or dragging an especific object to a new entry or an entry already created.

Once you have created the snapshot of the object, you can make annotations over it. Also you can create whichever snapshots per entry as you consider,

