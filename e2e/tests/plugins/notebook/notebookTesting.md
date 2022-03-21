    Notebook Testing:
## Useful commands:
1.  - To check default notebook:
    `JSON.parse(localStorage.getItem('notebook-storage'));`
1.  - Clear default notebook:
    `localStorage.setItem('notebook-storage', null);`

## I. Default Notebook:
1. Make sure there is no default notebook
    `localStorage.setItem('notebook-storage', null);`
2. Check for default notebook is null
    `JSON.parse(localStorage.getItem('notebook-storage'));`
3. Create 2 notebooks, add entry into first one to make it default now add entry to other one. Verify by icon change and using following
    1. `JSON.parse(localStorage.getItem('notebook-storage'));`
    2. There is default icon on notebook inside tree and main view after notebook name
    3. Inside default notebook, default section and page has deafult icon.
4. Delete default notebook and check for default notebook is null and default icons are removed.
    `JSON.parse(localStorage.getItem('notebook-storage'));`

## II. Sections and Pages:
1.  - Newly created notebook should have one Section and one page, 'Unnamed Section'/'Unnamed Page'

### - Sections:
1.  - Rename existing section '1 Section' and '1 Page'
    - click 'add section' new section - should be added 'Unnamed Section' with new page 'Unnamed Page'
1.  - Delete existing section
    - new 'Unnamed Section' automatically gets created.
1.  - Have 5 total sections without a default section/page
    - select 3nd section then delete 4th section
    - 3rd is still selected
1.  -  Have 5 total sections without a default section/page
    - select 3rd section then delete 3rd section
    - 1st is now selected
1.  - Have 5 total sections with a 3rd section as default section
    - select 2nd section then delete 2nd section
    - 3rd (default) is now selected
1.  - Have 5 total sections with a 3rd section as default section
    - select 3rd section then delete 3rd section
    - 1st is now selected and there is no default notebook

### - Pages:
1.  - Delete existing page
    - new 'Unnamed Page' automatically gets created
1.  - Have 5 total pages without a default page
    - select 3nd page then delete 4th page
    - 3rd is still selected
1.  - Have 5 total pages without a default page
    - select 3rd page then delete 3rd page
    - 1st is now selected
1.  - Have 5 total pages with a 3rd page as default page
    - select 2nd page then delete 2nd page
    - 3rd (default) is now selected
1.  - Have 5 total pages with a 3rd page as default page
    - select 3rd page then delete 3rd page
    - 1st is now selected and there is no default notebook

## III. Entries:
1.  - Add new entry into page should create entry and focus on it
1.  - Drag and drop any telmetry object on 'drop object'
    - new entry gets created with telemtry object
1.  - Add new entry into page
    - drop any telmetry object on this entry
    - telmetry object appears inside this entry
1.  - Add new entry into page, enter text
    - navigate away and return
    - edit entry text
    - navigate away and return back
    - confirm text is correct
1.  - delete previously created entry

## IV: Snapshot Menu:
1.  - There should be no default notebook
    - Clear default notebook if exists using `localStorage.setItem('notebook-storage', null);`
    - refresh page
    - Click on 'Notebook Snaphot Menu'
    - Following popup option should be there
        1. save to Notebook Snapshots
1.  - Check for default notebook if there is one, else add some entry into one of notebook to make it default
    - Click on 'Notebook Snaphot Menu'
    - Following popup options should be there
        1. save to Default Notebook
        1. save to Notebook Snapshots
1.  - Select any telemetry object eg: SWG
    - From 'Notebook Snaphot Menu' click on 'save to Default Notebook'
    - Navigate to default notebook - section - page and verify that SWG snaphot has been added with correct details

## V: Snapshot container:
1.  - Select any telemetry object eg: SWG
    - Click on 'Notebook Snaphot Menu'
    - from popup options click on 'save to Notebook Snapshots'
    - Snapshots indicator should blink, click on it to view snapshots
    - drag and drop snapshot on droppable area for new enrty
    - this should create a new entry with given snaphot has been added to it
1.  - Select any telemetry object eg: SWG
    - Click on 'Notebook Snaphot Menu'
    - from popup options click on 'save to Notebook Snapshots'
    - Snapshots indicator should blink, click on it to view snapshots
    - goto any notebook with pre exisintg entry (if not create new entry)
    - drag and drop snapshot on exisintg entry
    - this should add a given snaphot inside that entry

## VI: Embeds:
1.  - Add SWG using snapshot to notebook
    - Go to that entry
    - click on thumbnail image
    - should open image with PNG, JPG and Annotate buttons
    - verify they all work as intended
1.  - Add SWG using snapshot to notebook
    - note down start and end time on time conductor and Fixed Timestamp/Local Clock
    - Go to that entry
    - change start and end time on time conductor if Local Clock
    - click on embed Name/Text
    - should take to that object
    - also verify that start and end time on time conductor (also should automatically switch to Fixed timestamp)*/