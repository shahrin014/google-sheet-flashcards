# App Shell Specification

## Purpose
The surrounding application frame: navigation between the setup, preset, and study surfaces, the session menu, visual theme, and the installable offline shell that lets the app run as a static site on any host path.

## Requirements

### Requirement: Fully client-side operation
The system SHALL run entirely in the browser with no server component, and SHALL be servable as static files. Study SHALL require no account, no backend, and no API key.

#### Scenario: Static deployment
- GIVEN the app is built and served as static assets
- WHEN a learner opens it
- THEN all functionality is available without any server-side application

#### Scenario: No credentials collected
- GIVEN any screen in the app
- WHEN it is used
- THEN no sign-in, token, or API key is requested

### Requirement: Route map
The system SHALL expose these routes: a setup flow at `/setup` with a nested column-mapping step at `/setup/columns`, a preset list at `/presets`, and the study session at `/study`. Routing SHALL use URL fragments so the app works when served from any path without server rewrite rules.

#### Scenario: Fragment-based routing on a static host
- GIVEN the app is deployed under an arbitrary path with no server rewrite support
- WHEN the learner navigates between routes
- THEN each route is reachable via its fragment URL
- AND no request for a nonexistent server path is made

#### Scenario: Nested setup step
- GIVEN the learner is in the setup flow
- WHEN the column-mapping step is opened
- THEN it is reached from the setup route rather than being a separate top-level destination

### Requirement: Entry redirection
The system SHALL redirect the index route, and any unrecognized route, to the study screen when a configuration exists and to setup otherwise.

#### Scenario: Index with a configuration
- GIVEN a configuration is active
- WHEN the index route is opened
- THEN the learner is sent to the study screen

#### Scenario: Index without a configuration
- GIVEN no configuration is active
- WHEN the index route is opened
- THEN the learner is sent to setup

#### Scenario: Unknown route
- GIVEN an unrecognized route
- WHEN it is opened
- THEN the learner is redirected by the same rule as the index route

#### Scenario: Redirection replaces the entry
- GIVEN the index route redirects
- WHEN the redirect happens
- THEN the entry route is replaced rather than pushed, so Back does not return to it

### Requirement: Study session remount on configuration change
The study screen's session state SHALL be rebuilt from scratch whenever the deck configuration's identity changes, so no state leaks between two configurations.

#### Scenario: Configuration changed
- GIVEN a study session open on one configuration
- WHEN the active configuration changes to a different one
- THEN the session state is rebuilt for the new configuration
- AND no cards or history from the previous configuration remain in memory

#### Scenario: Configuration unchanged
- GIVEN the active configuration is unchanged
- WHEN the study screen renders
- THEN the existing session state is preserved

### Requirement: Session menu
The study screen SHALL offer a menu with actions to change sheet, copy the share link, switch preset, reset the current deck's progress, and clear all stored memory.

#### Scenario: Menu contents
- GIVEN an open study session
- WHEN the learner opens the menu
- THEN all five actions are available

#### Scenario: Change sheet from the menu
- GIVEN the menu is open
- WHEN the learner chooses to change sheet
- THEN the learner is taken to the setup flow

#### Scenario: Copy share link from the menu
- GIVEN the menu is open
- WHEN the learner chooses to copy the share link
- THEN the current deck's share link is copied and confirmed

#### Scenario: Destructive actions are distinguished
- GIVEN the menu is open
- WHEN it is displayed
- THEN the reset and clear-memory actions are styled as destructive and separated from the routine actions

#### Scenario: No configuration in the session
- GIVEN the study screen is open without an active configuration
- WHEN the menu is displayed
- THEN actions that require a configuration do nothing rather than failing

### Requirement: Configured deck fetching on session open
When the study screen has an active configuration, it SHALL fetch the sheet fresh rather than reuse a cached copy, so the learner studies the sheet's current contents.

#### Scenario: Session opened
- GIVEN an active configuration
- WHEN the study screen mounts
- THEN the sheet is re-fetched, bypassing any cached response

#### Scenario: Fetch abandoned on teardown
- GIVEN a sheet fetch in flight for a session
- WHEN that session is torn down before the fetch resolves
- THEN the late result is discarded and does not update a session that is no longer on screen

### Requirement: Visual theme
The app SHALL use a consistent theme with indigo as its primary colour, medium corner radii, and a colour scheme that follows the operating system's light or dark preference.

#### Scenario: System dark preference
- GIVEN the operating system is set to dark mode
- WHEN the app renders
- THEN it renders in dark mode

#### Scenario: System light preference
- GIVEN the operating system is set to light mode
- WHEN the app renders
- THEN it renders in light mode

### Requirement: Offline-capable shell
The app SHALL register a service worker so the application shell can be served offline, and SHALL reload exactly once when a newly installed version takes control, so the learner is not left on a stale build.

#### Scenario: Service worker registered
- GIVEN a browser that supports service workers
- WHEN the app loads
- THEN a service worker is registered for immediate activation

#### Scenario: New version activates
- GIVEN a new service worker version has just taken control
- WHEN the app receives that notification
- THEN the page reloads once to pick up the new version
- AND further notifications do not cause additional reloads

#### Scenario: Unsupported browser
- GIVEN a browser without service worker support
- WHEN the app loads
- THEN the app still runs and simply gains no offline capability