# calculator_ui_ts

React-Oberfläche für die [calculator_api_ts](https://github.com/Sascha-Pommernell/calculator_api_ts).
Die UI sendet **zwei oder mehr Operanden** als `{ "numbers": [n1, n2, …] }` an
`POST /api/calculate/{add|subtract|multiply|divide}` (links-assoziativ ausgewertet, z. B. `10 − 4 − 3 = 3`)
und zeigt das Ergebnis **exakt** so an, wie die API es liefert (bis zu 28 Nachkommastellen, z. B. `1 ÷ 3`).
Eingabefelder können über „Zahl hinzufügen“ ergänzt und – solange mehr als zwei vorhanden sind – wieder
entfernt werden.

Das Projekt ist bewusst so aufgebaut, dass die Architektur unverändert für große Anwendungen
weiterverwendet werden kann (Feature-basiert nach dem Vorbild von
[Bulletproof React](https://github.com/alan2207/bulletproof-react)).

## Stack

| Bereich          | Technologie                                   |
| ---------------- | --------------------------------------------- |
| UI               | React 19, TypeScript (strict), Vite 8         |
| Routing          | React Router (Data Router, lazy Routes)       |
| Server-State     | TanStack Query                                |
| Validierung      | zod (Env-Konfiguration, API-Antworten)        |
| Styling          | CSS Modules + globale Design-Tokens           |
| Tests            | Vitest, Testing Library, MSW (API-Emulation)  |
| Lint             | oxlint inkl. erzwungener Modulgrenzen         |

## Voraussetzungen

- Node.js ≥ 24
- Eine laufende `calculator_api_ts` (Standard: `http://localhost:3000`)

## Entwicklung

```bash
# 1. API starten (im Repo calculator_api_ts)
npm run dev

# 2. UI starten (in diesem Repo)
npm install
npm run dev
```

Der Vite-Dev-Server leitet `/api` und `/health` per Proxy an die API weiter (siehe
[vite.config.ts](./vite.config.ts)). Dadurch sind in der Entwicklung keine CORS-Header in der API nötig.
Läuft die API auf einem anderen Port, `API_PROXY_TARGET` in einer `.env.local` setzen
(siehe [.env.example](./.env.example)).

## Skripte

| Skript               | Zweck                                       |
| -------------------- | ------------------------------------------- |
| `npm run dev`        | Dev-Server mit HMR und API-Proxy            |
| `npm run build`      | Typecheck + Production-Build nach `dist/`   |
| `npm run preview`    | Production-Build lokal ausliefern           |
| `npm run typecheck`  | `tsc -b --noEmit` (inkl. Tests)             |
| `npm run lint`       | oxlint inkl. Architekturregeln              |
| `npm test`           | Unit-, Integrations- und Komponententests   |
| `npm run test:watch` | Tests im Watch-Modus                        |

## Konfiguration

Alle Variablen werden beim Start in [src/config/env.ts](./src/config/env.ts) per zod validiert –
ungültige Werte brechen den Start mit einer lesbaren Fehlermeldung ab.

| Variable                       | Default                 | Bedeutung                                                                                                   |
| ------------------------------ | ----------------------- | ----------------------------------------------------------------------------------------------------------- |
| `VITE_API_URL`                 | `""` (same origin)      | Basis-URL der API aus Sicht des Browsers (Build-Zeit). Leer lassen, wenn ein Proxy die API unter demselben Origin bereitstellt. |
| `VITE_HEALTH_POLL_INTERVAL_MS` | `30000`                 | Intervall der Health-Abfrage                                                                                |
| `VITE_HISTORY_LIMIT`           | `10`                    | Maximale Einträge im Verlauf                                                                                |
| `API_PROXY_TARGET`             | `http://localhost:3000` | Ziel des Dev-Server-Proxys (nur Entwicklung)                                                                |

**Produktion:** Entweder die UI hinter einem Reverse-Proxy ausliefern, der `/api` und `/health` an die API
weiterleitet (empfohlen, `VITE_API_URL` leer lassen), oder `VITE_API_URL` auf den API-Origin setzen – dann
muss die API CORS für den UI-Origin erlauben.

## Architektur

### Projektstruktur

```
src/
├── app/                      # Anwendungsschale: Provider, Router, Routen
│   ├── index.tsx             #   <App/> = Provider + Router
│   ├── provider.tsx          #   ErrorBoundary, QueryClientProvider, Suspense
│   ├── router.tsx            #   createBrowserRouter
│   ├── routes.tsx            #   Routen-Baum (lazy geladen)
│   └── routes/               #   Routen-Komponenten (komponieren Features)
├── components/               # Geteilte, feature-unabhängige Komponenten
│   ├── errors/               #   ErrorBoundary, Fallback
│   ├── layouts/              #   MainLayout
│   └── ui/                   #   Button, NumberField, Alert, …
├── config/                   # env.ts (zod-validiert), paths.ts (Routen-Registry)
├── features/                 # Fachliche Module, je eines pro Domäne
│   └── calculator/
│       ├── api/              #   Request-Funktionen + TanStack-Query-Hooks
│       ├── components/       #   Feature-Komponenten
│       ├── hooks/            #   Feature-Hooks (Client-State)
│       ├── types/            #   Fachliche Typen / API-Vertrag
│       ├── utils/            #   Reine Funktionen
│       └── index.ts          #   Öffentliche Schnittstelle des Features
├── lib/                      # Konfigurierte Bibliotheken: api-client.ts, react-query.ts
├── types/                    # Globale Typen
├── index.css                 # Design-Tokens, Reset
└── main.tsx                  # Einstiegspunkt

tests/                        # Spiegelt src/ (wie in calculator_api_ts)
├── mocks/                    #   MSW-Handler, die calculator_api_ts emulieren
├── utils/                    #   renderWithProviders, renderApp
├── setup.ts                  #   jest-dom + MSW-Lifecycle
└── …/*.test.ts(x)
```

### Abhängigkeitsregeln

Die Schichten dürfen nur in eine Richtung voneinander abhängen. Die Regeln werden von oxlint
erzwungen ([.oxlintrc.json](./.oxlintrc.json), `no-restricted-imports` + `import/no-cycle`):

```
app  →  features  →  components / lib / config / types / hooks / utils
```

| Regel                                                                | Gilt für            |
| -------------------------------------------------------------------- | ------------------- |
| Features werden nur über `@/features/<name>/index.ts` importiert     | gesamtes `src/`     |
| Geteilte Schichten importieren weder `@/features` noch `@/app`       | `components/`, `lib/`, `config/`, `types/`, `hooks/`, `utils/` |
| Features importieren weder andere Features noch `@/app`; innerhalb eines Features werden relative Pfade verwendet | `features/`         |
| Keine zyklischen Imports                                              | überall             |

Soll ein Feature Daten eines anderen nutzen, wird das in der `app`-Schicht komponiert
(Route, Provider) – nicht durch direkte Imports zwischen Features.

### Neues Feature anlegen

1. Ordner `src/features/<name>/` mit den benötigten Unterordnern anlegen.
2. Request-Funktionen in `api/` mit `apiClient.request(…)` schreiben und per
   `useQuery`/`useMutation` kapseln (`QueryConfig`/`MutationConfig` aus `lib/react-query.ts`).
3. Nur das, was die App braucht, in `index.ts` exportieren.
4. Route in `src/app/routes.tsx` ergänzen, Pfad in `src/config/paths.ts` registrieren.
5. Tests unter `tests/features/<name>/…` anlegen; neue Endpunkte in `tests/mocks/handlers.ts` emulieren.

### Designentscheidungen

- **Exakte Ergebnisse:** Die API liefert `result` als JSON-Zahl mit bis zu 28 Nachkommastellen.
  `JSON.parse` würde sie auf `double` runden, daher extrahiert
  [parse-calculation-response.ts](./src/features/calculator/api/parse-calculation-response.ts)
  das Literal aus dem Rohtext (Strukturprüfung per zod) und führt es als `string`.
- **Generischer HTTP-Client:** [lib/api-client.ts](./src/lib/api-client.ts) kennt keine Endpunkte,
  sondern nur den Fehler-Vertrag (`{ error }`) und übersetzt Transport-/HTTP-Fehler in typisierte
  Fehlerklassen (`ApiError`, `NetworkError`, `InvalidResponseError`). Gateway-Fehler ohne API-Body
  (502/503/504) gelten als „nicht erreichbar".
- **Server-State mit TanStack Query:** Berechnungen sind eine `useMutation`, der Health-Check eine
  `useQuery` mit `refetchInterval`. Lade-/Fehlerzustände, Deduplizierung und Devtools kommen aus
  der Bibliothek statt aus handgeschriebenen Hooks.
- **Realistische Tests mit MSW:** Statt `fetch` zu mocken, emulieren die Handler in
  [tests/mocks/handlers.ts](./tests/mocks/handlers.ts) die API inklusive Dezimal-Semantik
  (`decimal.js`, 29 signifikante Stellen). Unbehandelte Requests schlagen fehl.
- **Validierung zweistufig:** Clientseitig nur das Nötigste (leer, keine Zahl, unendlich) – für jedes
  Eingabefeld einzeln; die API bleibt die Quelle der Wahrheit (Wertebereich, Division durch null, Überlauf,
  Mindestanzahl von zwei Operanden).
- **Dynamische Operandenliste:** Die Felder werden über stabile IDs (nicht über den Index) verwaltet, damit
  das Entfernen eines mittleren Feldes die Werte der übrigen Felder nicht verschiebt; die Mindestanzahl
  (`MIN_OPERANDS = 2`) ist im Feature-Typ zentral definiert.
- **Barrierefreiheit:** Label/Input-Verknüpfung, `aria-invalid` + `aria-describedby` für Feldfehler,
  `aria-live` für das Ergebnis, `role="status"` für den API-Status, sichtbarer Fokus, Dark Mode via
  `prefers-color-scheme`.
