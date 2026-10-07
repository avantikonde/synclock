# 📖 SyncLock: Complete Learning Notes (Days 1 – 4)

A comprehensive, day-by-day reference of all system design decisions, data structures, Next.js patterns, database mechanics, algorithms, and real-world debugging lessons learned while building SyncLock from scratch.

---

# 📑 Table of Contents
1. [Day 1: Domain Architecture, Product Problem & Solution Design](#day-1-domain-architecture-product-problem--solution-design)
2. [Day 2: Cloud Database Infrastructure & Relational Schema Modeling](#day-2-cloud-database-infrastructure--relational-schema-modeling)
3. [Day 3: Backend API Endpoints & Organizer Creation Experience](#day-3-backend-api-endpoints--organizer-creation-experience)
4. [Day 4: Participant Availability Grid & Interactive Drag-Selection Engine](#day-4-participant-availability-grid--interactive-drag-selection-engine)
5. [Master Glossary & Mental Models](#master-glossary--mental-models)

---

# Day 1: Domain Architecture, Product Problem & Solution Design

### 1. The Core Problem with Existing Tools (The When2meet Gap)
Traditional scheduling tools like **When2meet** solve only one isolated step: **finding overlapping availability**. 
Once attendees finish voting, the process hits a dead end:
- The organizer must manually inspect the heatmap.
- The organizer must manually message participants on Slack/WhatsApp/Email.
- Someone has to manually create a calendar invite in Google Calendar or Outlook.
- No intake information can be collected beforehand (agendas, links, questions).
- No automated reminders exist, causing high no-show rates.
- No confirmation or locking mechanism exists to prevent double bookings.

### 2. The SyncLock Solution (The Complete Meeting Lifecycle)
SyncLock evolves an availability poll into an **end-to-end booking pipeline**:

```
[ Stage 1: Discovery ]
   Host defines title, candidate date boundaries, and daily time windows.
        │
        ▼
[ Stage 2: Voting ]
   Participants open public link & drag-select free intervals on an interactive grid.
        │
        ▼
[ Stage 3: Consensus ]
   Backend aggregates votes into a real-time heatmap showing maximum overlap.
        │
        ▼
[ Stage 4: Locking (Confirmation) ]
   Host uses private admin key to lock the winning slot (POLLING ──> LOCKED).
        │
        ▼
[ Stage 5: Execution ]
   Attendees fill intake forms, calendar invites (.ics/Google) are created, reminders sent.
```

### 3. Core Architectural Concepts
- **Organizer vs. Participant**: The organizer possesses administrative authority (locking slots, deleting events, viewing intake forms). Participants only submit availability and intake answers.
- **Why a Database is Essential**: Ephemeral in-memory state vanishes on server restart. A persistent database ensures poll links remain accessible indefinitely across multiple users and timezones.
- **The UTC Imperative**: 
  - If Alice votes in New York (`UTC-4`) and Bob votes in Mumbai (`UTC+5:30`), comparing local strings (`"10:00 AM"`) causes overlap math to fail.
  - **Golden Rule**: *All timestamps must be stored in UTC (`Z`). Time conversion to local time is strictly a presentation-layer concern handled by the client browser.*

---

# Day 2: Cloud Database Infrastructure & Relational Schema Modeling

### 1. Database Infrastructure: Neon Serverless PostgreSQL
- **Serverless PostgreSQL**: Spins down compute when idle, waking up in milliseconds on incoming queries.
- **Connection Pooling**: Serverless functions in Next.js open and close connections rapidly. Neon’s `-pooler` connection endpoint prevents exhausting PostgreSQL's maximum connection limit.
- **Environment Security**: The `DATABASE_URL` with credentials lives in `.env`. The `.env` file is strictly added to `.gitignore` to prevent credential exposure.

### 2. Prisma Schema Language (PSL) vs. TypeScript Syntax
Prisma uses its own Schema Definition Language with strict syntax rules:
- **No Colons (`:`)**: TypeScript uses `id: string`; Prisma PSL uses `id String` (space-separated).
- **UUIDs Require String Types**: An `@default(uuid())` generates text, so the column type must be `String`, not `Int`.
- **Enum Defaults Are Constants**: Enum defaults do **not** use quotation marks (`@default(POLLING)`, not `@default("POLLING")`).
- **Uniqueness Boundaries**: Marking `Participant.email` as `@unique` breaks the app because a user could only ever vote in **one single event in history**. Remove `@unique` from `Participant.email`.

### 3. The 2-Field Foreign Key Relation Pattern
In Prisma, linking one model to another requires **two companion fields**:
1. **The Scalar Field**: Stores the actual raw foreign key ID.
2. **The Relation Field**: Declares the ORM relationship, referenced fields, and cascade rules.

```prisma
model Availability {
  id            String      @id @default(uuid())
  slotTime      TimestamptzString

  // 1. Raw scalar ID column
  participantId String

  // 2. Relation link with cascade deletion
  participant   Participant @relation(fields: [participantId], references: [id], onDelete: Cascade)
}
```

### 4. Bi-Directional Relations
Prisma enforces referential integrity by requiring both sides of a relationship to define each other:
- In `Event`: `participants Participant[]`, `booking Booking?`, `intakeQuestions IntakeQuestion[]`.
- In `Participant`: `event Event`, `availabilities Availability[]`, `answers IntakeAnswer[]`.

### 5. Timestamps in Prisma 8: `TimestamptzString` vs `DateTime`
- In standard Prisma 8, declaring a field as `DateTime` maps to the TC39 `Temporal.Instant` object, which is not yet globally built into Node.js runtime environments.
- Using **`TimestamptzString`** creates the exact same PostgreSQL `timestamptz` column in the database, while in TypeScript it cleanly maps to standard ISO-8601 strings (`new Date().toISOString()`), avoiding experimental polyfill dependencies.

### 6. The 6 Core Relational Entities

| Model | Purpose | Key Attributes |
| :--- | :--- | :--- |
| **`Event`** | Root scheduling poll | `slug` (unique), `hostKey` (secret), `startDate`, `endDate`, `startHour`, `endHour`, `duration`, `status` |
| **`Participant`** | Voter in an event | `name`, `email` (optional), `eventId` (foreign key) |
| **`Availability`** | Discrete free time bucket | `slotTime` (UTC timestamp), `participantId` (foreign key) |
| **`Booking`** | Finalized confirmed meeting | `eventId` (unique 1-to-1), `startTime`, `endTime`, `meetingLink` |
| **`IntakeQuestion`** | Host custom questions | `eventId`, `question`, `isRequired` (boolean) |
| **`IntakeAnswer`** | Voter submitted answers | `questionId`, `participantId`, `answer` |

### 7. Essential Prisma Commands
- `npx prisma contract format`: Validates syntax and auto-indents PSL files.
- `npx prisma contract emit`: Generates TypeScript type definitions (`contract.d.ts` and `contract.json`).
- `npx prisma db update`: Pushes schema definitions directly to your live Neon database.

---

# Day 3: Backend API Endpoints & Organizer Creation Experience

### 1. Next.js App Router API Route Handlers
- **File-System Mapping**: Any file named `route.ts` inside `app/api/...` becomes an API endpoint.
- **HTTP Verb Functions**: Endpoints export named async functions matching HTTP verbs:
  ```typescript
  export async function POST(req: Request) { ... }
  export async function GET(req: Request) { ... }
  ```
- **Payload Extraction**: Read incoming JSON via `const body = await req.json()`.
- **Response Protocol**: Return typed JSON with appropriate HTTP status codes:
  - `201 Created`: When a record is successfully written to the database.
  - `400 Bad Request`: When required inputs (e.g., `title`, dates) are missing or invalid.
  - `404 Not Found`: When a requested resource or slug does not exist.
  - `500 Internal Server Error`: For unhandled exceptions (logged to console for debugging).

### 2. Cryptographic Random Identifiers (`crypto.randomBytes`)
Sequential IDs (e.g. `/events/1`, `/events/2`) are vulnerable to scraping. We use Node's built-in `crypto` module:
- **Public Slug**: 8 characters (`randomBytes(4).toString('hex')`) for clean, shareable URLs.
- **Private Host Key**: 32 characters (`randomBytes(16).toString('hex')`) acting as a secret password for the host admin dashboard.

### 3. Prisma 8 Query Syntax
```typescript
const newEvent = await db.orm.public.Event.create({
  title: title.trim(),
  slug,
  hostKey,
  duration: Number(duration),
  startDate: new Date(startDate).toISOString(),
  endDate: new Date(endDate).toISOString(),
  startHour: Number(startHour),
  endHour: Number(endHour),
  status: 'POLLING',
  ...
});
```

### 4. Client-Side State & Two-State View Architecture (`app/create/page.tsx`)
- **`'use client'` Directive**: Required at line 1 whenever a component uses React hooks (`useState`, `useEffect`) or browser APIs.
- **Two-State View Pattern**: Rather than redirecting immediately, the page conditionally renders based on `createdEvent`:
  - `createdEvent === null`: Shows the Event Creation Form.
  - `createdEvent !== null`: Shows the Success Drawer with copyable voter and admin links.
- **Clipboard API Feedback**:
  ```typescript
  navigator.clipboard.writeText(url);
  setCopiedType('public');
  setTimeout(() => setCopiedType(null), 2000); // Revert after 2 seconds
  ```

### 5. UI Craft: Avoiding "AI-Generated" Clichés
- Avoid excessive saturated purple gradients, bouncing party emojis, and verbose marketing copy.
- Favor clean, purposeful design: neutral zinc backgrounds (`#fafafa`), 1px borders, segmented tab selectors, and high typographic hierarchy.

---

# Day 4: Participant Availability Grid & Interactive Drag-Selection Engine

### 1. Dynamic Routing & Dynamic Params (`app/events/[slug]/page.tsx`)
- Next.js uses folder bracket notation `[slug]` to handle dynamic URL parameters.
- In Next.js 15/16, route parameters are promises:
  - Inside API Route Handlers: `const { slug } = await params;`
  - Inside Client Components: `const params = useParams(); const slug = params?.slug as string;`

### 2. The Critical Next.js Route Conflict Rule
> **A single folder cannot contain BOTH a `page.tsx` and a `route.ts`.**

- `app/api/events/[slug]/route.ts`: Serves **JSON data** via `GET`.
- `app/events/[slug]/page.tsx`: Serves the **visual HTML page** to the browser.
- *Placing `page.tsx` inside `app/api/...` triggers the error: `Conflicting route and page at /api/events/[slug]`.*

### 3. The Virtual Time Grid Generation Algorithm
The grid is a 2D coordinate matrix: **Columns = Days**, **Rows = Time Intervals**.

#### A. Date Array Generator (Columns)
Iterates day-by-day between `startDate` and `endDate`:
```typescript
const days = useMemo(() => {
  if (!event) return [];
  const list: Date[] = [];
  const current = new Date(event.startDate);
  const end = new Date(event.endDate);
  current.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  while (current <= end) {
    list.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  return list;
}, [event]);
```

#### B. Time Interval Generator (Rows)
Iterates in increments of `duration` (e.g. 15, 30, or 60 minutes) from `startHour` to `endHour`:
```typescript
const timeSlots = useMemo(() => {
  if (!event) return [];
  const slots = [];
  const startMins = event.startHour * 60;
  const endMins = event.endHour * 60;
  const step = event.duration || 30;

  for (let m = startMins; m < endMins; m += step) {
    const hour = Math.floor(m / 60);
    const minute = m % 60;
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    const displayMinute = minute < 10 ? `0${minute}` : `${minute}`;
    slots.push({ hour, minute, label: `${displayHour}:${displayMinute} ${period}` });
  }
  return slots;
}, [event]);
```

#### C. Unique Cell Key Formulation
Every cell coordinate is converted into a universal ISO timestamp:
```typescript
const getSlotKey = (day: Date, hour: number, minute: number) => {
  const d = new Date(day);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
};
```

### 4. The Drag-to-Select State Machine (Paintbrush vs. Eraser)

#### A. State Variables
- `selectedSlots`: A JavaScript `Set<string>` containing ISO keys of active cells.
- `isMouseDown`: Boolean tracking whether the user is actively dragging.
- `dragMode`: `'ADD' | 'REMOVE'` determined by the initial cell clicked.

#### B. The Paintbrush vs. Eraser Logic
When the user clicks down on a cell (`onMouseDown`):
- If the cell is **unselected**: `dragMode` becomes `'ADD'` (adds current and subsequent cells).
- If the cell is **already selected**: `dragMode` becomes `'REMOVE'` (deletes current and subsequent cells).

#### C. Hover Tracking (`onMouseEnter`)
As the mouse enters adjacent cells, if `isMouseDown === true`, the cell is updated according to the active `dragMode`.

#### D. The Global Window Mouseup Listener
If a user drags outside the table boundary and releases their click, table cell `onMouseUp` events will never fire. Attaching a global listener prevents the grid from getting stuck in dragging mode:
```typescript
useEffect(() => {
  const handleMouseUp = () => setIsMouseDown(false);
  window.addEventListener('mouseup', handleMouseUp);
  return () => window.removeEventListener('mouseup', handleMouseUp);
}, []);
```

#### E. Performance & Usability Optimizations
- **$O(1)$ Lookup with `Set`**: Checking `selectedSlots.has(key)` runs in constant time $O(1)$ compared to $O(N)$ with an array, keeping rendering smooth at 60fps.
- **`select-none`**: Applied to prevent browser text highlighting while dragging across cells.

---

# Master Glossary & Mental Models

| Term | Mental Model |
| :--- | :--- |
| **Slug** | The human-friendly, unguessable public URL identifier for an event (e.g. `e72a4d91`). |
| **Host Key** | The 32-character secret cryptographic token granting exclusive organizer permissions. |
| **Connection Pooling** | A pool of persistent database connections shared across serverless function invocations to prevent connection exhaustion. |
| **Cascade Delete** | Referential rule: if a parent `Event` is deleted, all dependent `Participant`, `Availability`, and `Booking` records are cleaned up automatically. |
| **PSL** | Prisma Schema Language—the declarative syntax used to define models and relations in `contract.prisma`. |
| **Paintbrush vs. Eraser** | State machine heuristic: clicking an empty cell turns drag into a selector; clicking a full cell turns drag into an eraser. |
| **UTC Normalization** | Storing all timestamps with zero offset (`Z`) so time comparison math remains independent of user geographical timezones. |

---

*Compiled for SyncLock project build — Days 1 through 4 complete.*

