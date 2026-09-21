# Web application boundaries

`src/admin-ui`, `src/default-theme`, and `src/shared` are the only
first-level source boundaries. There is no root `components/`, `contexts/`,
`pages/`, `hooks/`, `lib/`, `types/`, `utils/`, or `routes.ts` anymore —
every file, including each app's own route table, lives under one of the
three domains below, chosen by who actually consumes it.

## `src/admin-ui`

The built-in administration application: the admin console, terminal,
remote file management, and system/onboarding guides. Its build output is
`dist/admin/` and is never supplied by an installed theme.

```text
admin-ui/
├─ App.tsx              # admin root component, admin-only Providers
├─ routes.tsx            # the admin route table (mounted by App.tsx only)
├─ layout/               # AdminLayout, nav shell
├─ features/             # one directory per back-office domain
│  ├─ dashboard/ nodes/ monitoring/ notifications/ settings/
│  ├─ themes/ plugins/ account/ system/ operations/
├─ guides/               # install / database-migration / database-recovery / manage
├─ terminal/             # terminal + file manager + Monaco editor domain
├─ components/           # cross-feature admin components (menu bar, node
│                          # selector, dialogs) — feature-private components
│                          # stay inside their own features/<domain>/ instead
├─ contexts/             # admin-only state (terminal, ping tasks, node details, ...)
├─ hooks/ types/ utils/  # admin-only hooks/types/utilities
└─ config/                # menuConfig.json
```

## `src/default-theme`

The replaceable public theme: `/`, instance detail, public plugin pages,
and PWA behavior. Its build output is the stable theme package root, `dist/`
(kept compatible with third-party theme archives).

```text
default-theme/
├─ App.tsx
├─ routes.tsx            # the public route table (mounted by App.tsx only)
├─ layout/               # PublicLayout, NavBar, Footer
├─ features/             # overview / instance / plugin-page / pwa
├─ state/                # LiveDataContext (public-only)
├─ components/           # cross-feature theme components (e.g. ping charts
│                          # shared by overview and instance) — feature-private
│                          # components stay inside features/<name>/components/
└─ hooks/ types/ utils/  # theme-only helpers
```

Both apps follow the same rule for their own `components/`: it holds only
code shared *within that app* across more than one feature. A component used
by a single feature belongs inside that feature's own directory instead.

## `src/shared`

Only code actually consumed by both applications, organized by concern —
never a generic dumping ground:

```text
shared/
├─ api/        # api.ts, rpc2.ts, chunkUpload.ts
├─ auth/       # AccountContext, useTemporaryShareKey (temp_key -> cookie)
├─ contexts/   # RPC2Context, PublicInfoContext, NodeListContext, ThemeContext
├─ components/ # cross-app components: Login, Flag, PriceTags, ColorSwitch,
│               # ThemeSwitch, Language, ErrorBoundary, loading
├─ hooks/      # useLocalStorage, useSystemTheme, use-mobile
├─ i18n/       # config.ts + locales/
├─ types/      # metrics.ts, rpc2.ts
├─ utils/      # language.ts, metricSeries.ts, osImageHelper.ts, unitHelper.ts,
│               # cn.ts (shadcn's classname merge helper, used by shared/ui)
└─ ui/         # shadcn primitives + Icones (no business semantics)
```

Something belongs in `shared` only when it is genuinely imported from both
`admin-ui` and `default-theme` — verify with a grep before moving anything
here, don't move it because the name sounds generic.
