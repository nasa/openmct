# Introduction

The purpose of this document is to familiarize developers with the
overall architecture of Open MCT.

The target audience includes:

* _Platform maintainers_: Individuals involved in developing,
  extending, and maintaining capabilities of the platform.
* _Integration developers_: Individuals tasked with integrated
  Open MCT into a larger system, who need to understand
  its inner workings sufficiently to complete this integration.

As the focus of this document is on architecture, whenever possible
implementation details (such as relevant API or JSON syntax) have been
omitted. These details may be found in the developer guide.

# Overview

Open MCT is client software: It runs in a web browser and
provides a user interface, while communicating with various
server-side resources through browser APIs.

```nomnoml
#direction: right
[Client|[Browser|[Open MCT]->[Browser APIs]]]
[Server|[Web services]]
[Client]<->[Server]
```

While Open MCT can be configured to run as a standalone client,
this is rarely very useful. Instead, it is intended to be used as a
display and interaction layer for information obtained from a
variety of back-end services. Doing so requires authoring or utilizing
adapter plugins which allow Open MCT to interact with these services.

Typically, the pattern here is to provide a known interface that
Open MCT can utilize, and implement it such that it interacts with
whatever back-end provides the relevant information.
Examples of back-ends that can be utilized in this fashion include
databases for the persistence of user-created objects, or sources of
telemetry data.

## Software Architecture

The simplest overview of Open MCT is to look at it as a "layered"
architecture, where each layer more clearly specifies the behavior
of the software.

```nomnoml
#direction: down
[Open MCT|
  [Platform]<->[Application]
  [Framework]->[Application]
  [Framework]->[Platform]
]
```

These layers are:

* [_Framework_](framework.md): The framework layer is responsible for
  managing the interactions between application components. It has no
  application-specific knowledge; at this layer, we have only
  established an abstraction by which different software components
  may communicate and/or interact.
* [_Platform_](platform.md): The platform layer defines the general look,
  feel, and behavior of Open MCT. This includes user-facing components like
  Browse mode and Edit mode, as well as underlying elements of the
  information model and the general service infrastructure.
* _Application_: The application layer defines specific features of
  an application built on Open MCT. This includes adapters to
  specific back-ends, new types of things for users to create, and
  new ways of visualizing objects within the system. This layer
  typically consists of a mix of custom plug-ins to Open MCT,
  as well as optional features (such as Plot view) included alongside
  the platform.
