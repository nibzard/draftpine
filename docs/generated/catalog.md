# Draftpine Catalog

## Primitives

### core.cardGrid

Grid of linked or static cards for features, outcomes, hubs, and related links.

Variants: compact, spacious

Layouts: core.gridAuto, core.cardGrid

Slots:

- `title`: string
- `description`: text
- `items`: array required

### core.codePanel

Code or command panel with approved overflow containment.

Variants: default

Layouts: core.stack

Slots:

- `title`: string required
- `description`: text
- `code`: code required
- `language`: string

### core.comparisonTable

At-a-glance comparison table with approved horizontal overflow containment.

Variants: compact

Layouts: core.scrollX

Slots:

- `title`: string
- `description`: text
- `columns`: array required
- `rows`: array required

### core.dataTable

Compact table/list view for operational dashboards and directories.

Variants: compact, status

Layouts: core.stack, core.scrollX

Slots:

- `title`: string required
- `description`: text
- `columns`: array
- `rows`: array

### core.decisionHero

Compact decision-framed hero for pricing, comparison, and conversion pages.

Variants: compact, centered

Layouts: core.stack, core.split

Slots:

- `eyebrow`: string
- `title`: string required
- `description`: text required
- `primaryAction`: action required
- `secondaryAction`: action
- `signal`: string

### core.faq

FAQ disclosure list.

Variants: default

Layouts: core.stack

Slots:

- `title`: string required
- `items`: array required

### core.filterableList

Filterable list with empty state.

Variants: default

Layouts: core.stack

Slots:

- `title`: string required
- `items`: array required
- `empty`: object

### core.finalCta

Final call-to-action section.

Variants: default, compact

Layouts: core.stack

Slots:

- `title`: string required
- `description`: text
- `primaryAction`: action required
- `secondaryAction`: action

### core.footer

Footer primitive used by generated shells.

Variants: default

Layouts: core.stack

Slots:


### core.heroProof

Hero with primary copy, CTA, and concrete proof artifact.

Variants: developer, marketing, app

Layouts: core.split, core.stack, core.heroProof

Slots:

- `eyebrow`: string
- `title`: string required
- `description`: text required
- `primaryAction`: action required
- `secondaryAction`: action
- `proof`: object required

### core.metricBand

Metric strip for dashboards and proof.

Variants: compact

Layouts: core.gridAuto

Slots:

- `items`: array required

### core.modalForm

Static contact or intent form modal interaction.

Variants: default

Layouts: core.stack

Slots:

- `title`: string required
- `description`: text
- `buttonLabel`: string required
- `success`: string

### core.pricingTable

Plan cards or table for pricing decisions.

Variants: threePlan, table, usage

Layouts: core.gridAuto, core.scrollX

Slots:

- `title`: string
- `description`: text
- `items`: array required

### core.productMockup

A bounded product UI artifact card for showing workflow state, schedules, lists, and product chrome.

Variants: calendar, workflow, dashboard

Layouts: core.stack, core.gridAuto

Slots:

- `title`: string required
- `description`: text
- `toolbar`: array
- `panels`: array required
- `activity`: array

### core.settingsList

Grouped settings rows with visible states and actions.

Variants: account, product

Layouts: core.stack, core.sidebar

Slots:

- `title`: string required
- `description`: text
- `groups`: array

### core.siteShell

Compiler-owned site shell marker.

Variants: default

Layouts: core.stack

Slots:


### core.statePanel

State panel for empty, error, warning, and success states.

Variants: default

Layouts: core.stack

Slots:

- `state`: enum required
- `title`: string required
- `description`: text
- `action`: action

### core.stepperFlow

Step-based flow for onboarding, checkout, intake, and setup screens.

Variants: checkout, onboarding, intake

Layouts: core.stack, core.split

Slots:

- `title`: string required
- `description`: text
- `steps`: array
- `summary`: object
- `primaryAction`: action

### core.supportPanel

Support triage panel with help paths and current system state.

Variants: triage, helpCenter

Layouts: core.stack, core.gridTwo

Slots:

- `title`: string required
- `description`: text
- `options`: array
- `status`: array

### core.themeToggle

Theme toggle primitive used by the shell.

Variants: default

Layouts: core.cluster

Slots:


### core.timelineFeed

Narrative timeline or activity feed for editorial and product history pages.

Variants: editorial, activity

Layouts: core.stack

Slots:

- `title`: string required
- `description`: text
- `items`: array

## Layouts

### core.appShell

Operational app shell layout for dashboard-like pages.

Overflow: forbidden

### core.cardGrid

Responsive card grid layout.

Overflow: forbidden

### core.cluster

Wrapping inline cluster for chips, actions, and meta rows.

Overflow: forbidden

### core.gridAuto

Auto-fit responsive grid using safe minmax constraints.

Overflow: forbidden

### core.gridThree

Three-column grid that collapses to one column on mobile.

Overflow: forbidden

### core.gridTwo

Two-column grid that collapses to one column on mobile.

Overflow: forbidden

### core.heroProof

Hero proof composition layout.

Overflow: forbidden

### core.inspectorSidebar

Main content plus inspector/sidebar layout.

Overflow: forbidden

### core.scrollX

Approved horizontal scroll wrapper for wide artifacts.

Overflow: allowed

### core.sidebar

Sidebar and content layout that collapses on mobile.

Overflow: forbidden

### core.split

Responsive two-column split that collapses on mobile.

Overflow: forbidden

### core.splitForm

Form or intake layout with a summary rail.

Overflow: forbidden

### core.stack

Vertical stack layout with controlled gaps.

Overflow: forbidden

### core.stepper

Progressive flow layout for checkout and onboarding.

Overflow: forbidden

### core.tableList

Dense table/list layout for record review pages.

Overflow: conditional

### core.timeline

Timeline or activity layout for editorial and history pages.

Overflow: forbidden

### core.toolbar

Wrapping toolbar for controls and actions.

Overflow: forbidden

## Route Types

### appDashboard

Present operational app state and primary workflow actions.

Required primitives: core.metricBand

### article

Present long-form narrative content.

Required primitives: none

### checkout

Guide a user through review, confirmation, or purchase steps.

Required primitives: core.stepperFlow

### comparison

Help a user compare a product against an alternative.

Required primitives: core.decisionHero, core.comparisonTable

### contact

Let users choose a contact path or submit intent.

Required primitives: core.modalForm

### detail

Explain one feature, use case, integration, or industry.

Required primitives: core.heroProof, core.productMockup

### directory

Help users browse, filter, and compare a set of entries.

Required primitives: core.filterableList

### docs

Explain usage or implementation.

Required primitives: core.codePanel

### editorial

Present narrative content with proof, timeline, or related references.

Required primitives: core.timelineFeed

### home

Introduce product/category, show proof, and drive the primary action.

Required primitives: core.heroProof, core.productMockup, core.finalCta

### hub

Organize and link a route group.

Required primitives: core.cardGrid

### legal

Present legal or static policy content.

Required primitives: none

### onboarding

Guide a user through first setup.

Required primitives: core.stepperFlow

### pricing

Help a user make a buying or plan decision.

Required primitives: core.decisionHero, core.pricingTable

### settings

Configure product or account behavior.

Required primitives: core.settingsList

### support

Let users diagnose an issue and choose a help path.

Required primitives: core.supportPanel

### utility

Support a narrow utility workflow.

Required primitives: none

