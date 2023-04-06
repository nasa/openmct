# Plan view and domain objects
Plans provide a view for a list of activities grouped by categories.

## Plan category and activity JSON format
The JSON format for a plan consists of categories/groups and a list of activities for each category.
Activity properties include:
* name: Name of the activity
* start: Timestamps in milliseconds
* end: Timestamps in milliseconds
* type: Matches the name of the category it is in
* color: Background color for the activity
* textColor: Color of the name text for the activity
* The format of the json file is as follows:

```json
{
    "TEST_GROUP": [{
    "name": "Event 1 with a really long name",
    "start": 1665323197000,
    "end": 1665344921000,
    "type": "TEST_GROUP",
    "color": "orange",
    "textColor": "white"
    }],
    "GROUP_2": [{
    "name": "Event 2",
    "start": 1665409597000,
    "end": 1665456252000,
    "type": "GROUP_2",
    "color": "red",
    "textColor": "white"
    }]
}
```

## Plans using JSON file uploads
Plan domain objects can be created by uploading a JSON file with the format above to render categories and activities.

## Using Domain Objects directly
If uploading a JSON is not desired, it is possible to visualize domain objects of type 'plan'.
The standard model is as follows: 
```javascript
{
    identifier: {
        namespace: ""
        key: "test-plan"
    }
    name:"A plan object",
    type:"plan",
    location:"ROOT",
    selectFile: {
        body: {
            SOME_CATEGORY: [{
                    name: "An activity",
                    start: 1665323197000,
                    end: 1665323197100,
                    type: "SOME_CATEGORY"
                }
            ],
            ANOTHER_CATEGORY: [{
                    name: "An activity",
                    start: 1665323197000,
                    end: 1665323197100,
                    type: "ANOTHER_CATEGORY"
                }
            ]
        }
    }
}
```

If your data has non-standard keys for `start, end, type and activities` properties, use the `sourceMap` property mapping.
```javascript
{
    identifier: {
        namespace: ""
        key: "another-test-plan"
    }
    name:"Another plan object",
    type:"plan",
    location:"ROOT",
    sourceMap: {
        start: 'start_time',
        end: 'end_time',
        activities: 'items',
        groupId: 'category'
    },
    selectFile: {
        body: {
            items: [
                {
                    name: "An activity",
                    start_time: 1665323197000,
                    end_time: 1665323197100,
                    category: "SOME_CATEGORY"
                },
                {
                    name: "Another activity",
                    start_time: 1665323198000,
                    end_time: 1665323198100,
                    category: "ANOTHER_CATEGORY"
                }
            ]
        }
    }
}
```

## Rendering categories and activities:
The algorithm to render categories and activities on a canvas is as follows:
* Each category gets a swimlane.
* Activities within a category are rendered within it's swimlane.
* Render each activity on a given row if it's duration+label do not overlap (start/end times) with an existing activity on that row.
* Move to the next available row within a swimlane if there is overlap
* Labels for a given activity will be rendered within it's duration slot if it fits in that rectangular space.
* Labels that do not fit within an activity's duration slot are rendered outside, to the right of the duration slot.

