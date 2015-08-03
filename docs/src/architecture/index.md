# Introduction

This is a placeholder for an architectural description of Open MCT Web.

```nomnoml
[<start> Start]->[<state> Load bundles.json]
[Load bundles.json]->[<state> Load bundle.json files]
[Load bundle.json files]->[<state> Resolve implementations]
[Resolve implementations]->[<state> Register with Angular]
[Register with Angular]->[<state> Bootstrap application]
[Bootstrap application]->[<end> End]
```
