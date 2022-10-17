# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.2.2] - 2022-10-17
### Fixed
- Fixed wrong database type for "date"

## [1.2.1] - 2022-09-06
### Fixed
- Fixed possibility of command scheduling failure due to invalid database type

## [1.2.0] - 2022-08-18
### Changed
- Return values of a command handler that do not have a `type` property will be ignored

### Fixed
- Bug where event handler could not execute after Kafka retry mechanism kicked in

### Added
- Filtering duplicate events that will be replayed on startup to improve performance
- Emitting a `TOMBSTONE` event will delete the whole aggregate
- Blackrik function `deleteAggregate` (also available in side effects)

## [1.1.3] - 2021-08-05
### Changed
- Aggregate projections can now be async

### Fixed
- Bug where idempotency in read model store fails for multiple inserts/updates per event
- Bug where projections handle events in a wrong order during a replay 

### Added
- New option `index` for ReadModelStore.defineTable scheme, to allow B-Tree and FULLTEXT indexing of fields
- Database reconnect on connection loss for eventstore-mysql and readmodelstore-mysql

## [1.1.2] - 2021-05-05
### Changed
- Renamed workflow property `currentEvent` to `event`
- Renamed workflow function `transition` to `trigger`
- EventBus adapter interface and added function `stop`
- EventStore adapter interface and added function `close`
- ReadModelStore adapter interface and added function `close`

### Fixed
- Bug where MySQL read model adapter may override an open database connection with a new one which results in closing only the latest connection

### Added
- Alternative HTTP route to execute commands
- New property `latestEventPosition` inside the context of commands
- Blackrik function `stop` to stop a running application

## [1.1.1] - 2021-04-19
### Changed
- MySQL read model schema types are now case insenitive

### Fixed
- Workflows no longer create a new state for every event in case of a replay
- Bug where MySQL read model did not add indices after a schema change

### Added
- Support for variable-length strings in MySQL read model schema

## [1.1.0] - 2021-04-14
### Changed
- Renamed errors property `code` to `status` to let Express handle status codes from thrown errors
- Error handling for saving events to the event store

### Fixed
- MySQL event store adapter no longer rejects events without payload

### Added
- Wrapped route handlers and middleware to catch and handle errors as errors in async functions are only handled by Express 5 or higher (which is not production ready yet)
- A way to set the context for commands and queries with the config property `contextProvider`
- Workflows for Sagas to use them as a state machine (this is optional)

## [1.0.3] - 2021-04-09
### Changed
- MySQL read model store adapter now returns plain objects instead of BinaryRow objects

### Fixed
- Bug where it was possible that the public Blackrik functions (executeCommand, executeQuery, ...) lose their scope

## [1.0.2] - 2021-04-08
### Changed
- Updated README.md
- MySQL read model store adapter now throws an error if a key was explicitly set to `undefined` inside query

### Fixed
- MySQL read model store adapter no longer throws an error if a primary-key field comes after a non-primary-key field inside scheme (defineTable)

### Added
- Keywords to package.json

## [1.0.1] - 2021-04-07
### Added
- Initial release

[Unreleased]: https://github.com/wesone/blackrik/compare/v1.2.2...HEAD
[1.2.2]: https://github.com/wesone/blackrik/compare/v1.2.1...v1.2.2
[1.2.1]: https://github.com/wesone/blackrik/compare/v1.2.0...v1.2.1
[1.2.0]: https://github.com/wesone/blackrik/compare/v1.1.3...v1.2.0
[1.1.3]: https://github.com/wesone/blackrik/compare/v1.1.2...v1.1.3
[1.1.2]: https://github.com/wesone/blackrik/compare/v1.1.1...v1.1.2
[1.1.1]: https://github.com/wesone/blackrik/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/wesone/blackrik/compare/v1.0.3...v1.1.0
[1.0.3]: https://github.com/wesone/blackrik/compare/v1.0.2...v1.0.3
[1.0.2]: https://github.com/wesone/blackrik/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/wesone/blackrik/compare/v1.0.0...v1.0.1
