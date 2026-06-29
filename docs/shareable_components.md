# Shareable components

A curated catalog of the reusable UI building blocks in `src/components/`. It exists
so we (and Claude) can see the big picture and reuse what already exists instead of
rebuilding it.

> **Rule:** whenever a shareable component is **added, changed, or planned**, update
> this file. Keep entries accurate (props, scoping, backing data) and add a live demo
> to the dev gallery (`src/dev/ComponentsPage.tsx`, reachable at `/components`).

Conventions shared by all of these:
- **Controlled**: `value` + `onChange` (single) or `value: T[]` + `onChange: (T[])` (multi).
- Props interface named `<Component>Props`; default control size is `sm` (theme).
- Optional knobs follow a house style: `width?`, `placeholder?`, `allowAny?`/`includeAll?`.

---

## RolePicker  ·  `components/RolePicker.tsx`
Shareable role selector. **Replaced the old `RoleSelect`** (deleted) — it's a strict
superset, so with no `teamType`/`includeAll` it renders the same flat role list.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `value` | `Role` | — | selected role (`role_base/v1` enum) |
| `onChange` | `(role: Role) => void` | — | |
| `teamType?` | `TeamType` (`user_iface/v2`) | — | scope offered roles to a team type; omit = all roles |
| `includeAll?` | `boolean` | `false` | prepend "All roles" (`UNSPECIFIED`) — for list filters |
| `width?` | `string` | `"220px"` | |
| `placeholder?` | `string` | `"Select role"` | |

- **Scoping** lives in `rolesForTeamType(teamType?)` in [`lib/roles.ts`](../src/lib/roles.ts): WAREHOUSE → Warehouse roles, SELLING → Team/CS roles, ADMIN → Admin/Root, else all. Frontend UX grouping only (backend doesn't enforce it) — tweak in one place.
- **Note:** `teamType` is the `user_iface/v2/v2_user_pb` enum (the one `useTeam().currentTeam.teamType` uses), **not** `common/v1/team_pb`'s `TeamType`.
- An out-of-scope current `value` (a real role not in the scoped list) is still shown — it's appended so the trigger never blanks out a live selection.
- Used by: `users/UsersPage` + `team/TeamMemberList` (role filters, unscoped — a filter must reach every role a member may hold), `team/AddTeamMemberDialog` + `users/TeamMemberDialog` (role assignment). Scoping (`teamType`) is best for assignment, not filtering.
- `<RolePicker value={role} onChange={setRole} teamType={teamType} />`

## TeamPicker  ·  `components/TeamPicker.tsx`
Searchable, single-select team selector backed by the server (`teamClient.publicTeamList`,
debounced per keystroke) so it scales past one page. Resolves a preselected id's label
on mount via `publicTeamIDs`.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `value` | `bigint` | — | selected team id (`0n` = none) |
| `onChange` | `(id: bigint) => void` | — | |
| `allowAny?` | `boolean` | `false` | show a clear button → `0n` |
| `teamType?` | `TeamType` (`common/v1`) | — | lock the search to one team type (no dropdown) |
| `showTypeFilter?` | `boolean` | `false` | render a Warehouse/Selling/Admin type dropdown joined into the field (ignored if `teamType` set) |
| `placeholder?` | `string` | `"Search team…"` | |
| `width?` | `string` | `"240px"` | |

- **Note:** uses `common/v1/team_pb`'s `TeamType` (distinct from RolePicker's).
- `<TeamPicker value={id} onChange={setId} allowAny showTypeFilter />`

## ShippingPicker  ·  `components/ShippingPicker.tsx`
Courier picker (Popover + removable chips). Single or multi select. Loads the courier
list once (`shipmentClient.publicShipmentList`) and filters client-side.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `value` | `bigint[]` | — | selected courier ids (array even in single mode) |
| `onChange` | `(ids: bigint[]) => void` | — | |
| `multiple?` | `boolean` | `true` | `false` = pick one and close |
| `allowAny?` | `boolean` | `false` | offer a clear action |
| `buttonLabel?` | `string` | `"Add courier"` | trigger text |
| `placeholder?` | `string` | `"Search courier…"` | |
| `width?` | `string` | `"320px"` | |

- `<ShippingPicker multiple={false} value={ids} onChange={setIds} allowAny />`

## EnumSelect  ·  `components/EnumSelect.tsx`
Generic numeric-enum dropdown (protobuf-es enum numbers). The base other enum selects
follow.

| Prop | Type | Default |
| --- | --- | --- |
| `value` | `number` | — |
| `onChange` | `(value: number) => void` | — |
| `options` | `EnumOption[]` (`{ label, value }`) | — |
| `placeholder?` | `string` | `"Select"` |
| `width?` | `string` | `"200px"` |

## StringSelect  ·  `components/StringSelect.tsx`
String-valued sibling of `EnumSelect`, for dynamic/string-keyed option lists.

| Prop | Type | Default |
| --- | --- | --- |
| `value` | `string` | — |
| `onChange` | `(value: string) => void` | — |
| `options` | `StringOption[]` (`{ label, value }`) | — |
| `placeholder?` | `string` | `"Select"` |
| `width?` | `string` | `"200px"` |
| `disabled?` | `boolean` | — |

## PasswordInput  ·  `components/PasswordInput.tsx`
Password field with a leading lock icon and a show/hide toggle.

| Prop | Type | Notes |
| --- | --- | --- |
| `value` | `string` | |
| `onChange` | `(value: string) => void` | |
| `placeholder?` | `string` | |
| `autoFocus?` | `boolean` | |

---

## Planned

### UserPicker (separate task)
Single-select, searchable user chooser backed by `userClient.searchUser`; scope via a
`teamId?` prop (omit = current team from `useTeam()`, `0n` = all teams, a specific id =
that team). See the plan; add its entry here when built.
