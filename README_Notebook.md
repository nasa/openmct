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

## How to use it:
Click on the create menu button at the left top corner of the creen and create a notebook object.
After you saved it you can start to create new entries, either clicking inside of the drag area or dragging an especific object to a new entry or an entry already created.

Once you have created the snapshot of the object, you can make annotations over it. Also you can create whichever snapshots per entry as you consider,

## CouchDB Persistence storage

Open MCT is packaged along with a few general-purpose plugins among them the CouchDB plugin:

* `openmct.plugins.CouchDB` is an adapter for using CouchDB for persistence
  of user-created objects. This is a constructor that takes the URL for the
  CouchDB database as a parameter, e.g.
```javascript
openmct.install(openmct.plugins.CouchDB('url-to-your-CouchDB-database'))
```
You can install and host your DB or use services like cloudant https://www.ibm.com/cloud/cloudant.com

To manage the DB you can use tools like Fauxton: http://couchdb.apache.org/fauxton-visual-guide/, it commonly comes bundled with CouchDB installation.

To avoid Cross-Origin Resource Sharing (CORS) on remote servers connections please config your CORS settings and add your domain. For instance on Cloudant:

![cors1](https://user-images.githubusercontent.com/18453600/32687056-667b3fc6-c681-11e7-8cd5-39e000dd816c.png)

You have to create a database for the app and then create an user or API Key to grant database permissions for writing/reading it.

![cors2](https://user-images.githubusercontent.com/18453600/32687060-96725142-c681-11e7-96fe-b9d298ad294c.png)

If you have the LocalStorage plugin enabled remove its call from index.html and replace it for the CouchDB plugin.

After that copy the url of your DB and paste it as an argument of the CouchDB plugin call:
```javascript
openmct.install(openmct.plugins.CouchDB('CouchDB-host/database-name'))
```

Any config issue you can refer to CouchDB docs http://docs.couchdb.org/en/2.1.1/.

