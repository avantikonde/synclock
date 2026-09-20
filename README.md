This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.



# Day 1
## 1. What is SyncLock?

### Definition

SyncLock is a **group scheduling and meeting coordination platform**.

It helps multiple people find a suitable common time and then goes beyond simple availability by handling the later stages of the meeting lifecycle.

The basic idea is:

**Find a common time → confirm the meeting → collect information → create calendar event → send reminders**


## 2. What Problem Does SyncLock Solve?

Scheduling a meeting with multiple people usually involves:

- Asking everyone for their availability
    
- Comparing different people's schedules
    
- Finding a common time
    
- Confirming the final time
    
- Collecting additional information
    
- Adding the meeting to calendars
    
- Sending reminders
    
- Handling cancellation or rescheduling
    

## 3. SyncLock vs Traditional Availability Tools

A traditional tool like a When2meet-style application mainly focuses on:

**Finding overlapping availability.**

The basic workflow is:

```text
Create event
      ↓
Choose possible times
      ↓
Share link
      ↓
Participants submit availability
      ↓
Find common time
```

SyncLock expands the workflow:

```text
Create scheduling event
        ↓
Choose dates + possible times
        ↓
Share event link
        ↓
Participants submit availability
        ↓
Calculate overlapping availability
        ↓
Organizer selects final time
        ↓
Booking created
        ↓
Collect intake information
        ↓
Calendar event created
        ↓
Reminders scheduled
        ↓
Meeting
```

So SyncLock is not only an **availability finder**.

It is intended to become a **meeting coordination workflow**.

## 4. Core SyncLock Workflow

The complete flow can be thought of in stages.

## Stage 1 — Organizer creates an event

The organizer enters information such as:

- Event title
    
- Description
    
- Possible dates
    
- Possible times
    
- Meeting duration
    

Example:

```text
Event:
Project Discussion

Possible dates:
25 September
26 September
27 September

Possible times:
10:00 AM
10:30 AM
11:00 AM
11:30 AM

Duration:
30 minutes
```

---

## 5. Stage 2 — SyncLock Creates a Shareable Event

After the organizer creates the event, SyncLock generates a public/shareable link.

Conceptually:

```text
Organizer
    ↓
Create Event
    ↓
SyncLock
    ↓
Shareable Link
```

The organizer can send this link to participants.

---

# 6. Stage 3 — Participants Join

Participants open the shared link.

They should be able to see relevant event information and submit their availability.

A participant might provide:

```text
Name: Rahul

Availability:

10:00 → Available
10:30 → Available
11:00 → Not Available
11:30 → Available
```

Another participant may have different availability.

---

# 7. Stage 4 — SyncLock Stores Availability

The system needs to remember each participant's availability.

Conceptually:

```text
Participant
     ↓
Availability
     ↓
Date + Time
```

For example:

```text
Rahul
10:00 → Available
10:30 → Available
11:00 → Unavailable
```

The important point is:

> Availability is information about whether a participant can attend at a particular proposed time.

---

# 8. Stage 5 — Find Overlapping Availability

Once participants submit their availability, SyncLock can compare their responses.

Example:

```text
              10:00   10:30   11:00   11:30

Rahul          ✓       ✓       ✗       ✓
Priya          ✗       ✓       ✓       ✓
Aman           ✓       ✓       ✗       ✓
```

The common available times are:

```text
10:30
11:30
```

SyncLock can therefore present these as possible common slots.

### Important concept

The system doesn't necessarily need to permanently store:

> "10:30 is the overlap."

It can calculate the overlap from the stored availability data.

---

# 9. Stage 6 — Organizer Chooses Final Time

The organizer reviews the available options.

For example:

```text
Possible common times:

10:30 AM
11:30 AM
```

The organizer chooses:

```text
11:30 AM
```

At this point, the scheduling process becomes a **booking**.

---

# 10. Availability vs Booking

This distinction is extremely important.

### Availability

Answers:

> "Can this person attend at this time?"

Example:

```text
Rahul → Available → 11:30
```

### Booking

Answers:

> "What time has actually been confirmed for the meeting?"

Example:

```text
Project Discussion
Date: 25 September
Time: 11:30 AM
Duration: 30 minutes
```

So:

```text
Availability ≠ Booking
```

Availability helps **find possible times**.

Booking represents the **final confirmed meeting**.

---

# 11. Stage 7 — Intake Information

SyncLock can optionally collect additional information before the meeting.

For example:

```text
What would you like to discuss?

Do you have anything you want us
to prepare beforehand?
```

Participants can submit answers.

These responses become part of the meeting information.

---

# 12. Stage 8 — Calendar Integration

Once the meeting is confirmed, SyncLock can create an event in an external calendar.

Conceptually:

```text
SyncLock Booking
       ↓
Calendar Integration
       ↓
Google Calendar / Other Calendar
```

The purpose is to make sure the confirmed meeting appears in the participant/organizer's calendar.

---

# 13. Stage 9 — Reminders

SyncLock can schedule reminders for the confirmed meeting.

For example:

```text
Meeting:
25 September — 11:30 AM

Reminder:
24 September — 11:30 AM
```

The system needs to remember:

- Which booking the reminder belongs to
    
- When the reminder should be sent
    
- Whether it has already been sent
    

---

# 14. Stage 10 — Cancellation / Rescheduling

A real scheduling system cannot stop after creating a booking.

Suppose:

```text
Original:
25 September — 11:30 AM
```

The organizer reschedules it to:

```text
26 September — 2:00 PM
```

Other parts of the system may need to change too.

For example:

```text
Booking
   ↓
Calendar Event
   ↓
Reminder
```

If the booking changes, the related calendar event and reminders may also need to be updated.

This is called **propagation of changes** through the system.

---

# 15. SyncLock User Types

At a basic level, SyncLock has two important roles.

## Organizer

The person creating and managing the scheduling event.

Organizer can:

- Create event
    
- Define possible dates/times
    
- Share event
    
- View participant availability
    
- Select final time
    
- Manage booking
    
- Handle rescheduling/cancellation
    

## Participant

The person invited to the scheduling event.

Participant can:

- Open event link
    
- View event information
    
- Enter their information
    
- Submit availability
    
- Provide intake information
    
- Receive confirmation/reminders
    

---

# 16. SyncLock System Architecture

At a high level:

```text
                 SYNCLOCK

Organizer ────────┐
                  │
Participant ──────┤
                  ↓
             Frontend
                  ↓
             Backend/API
                  ↓
              Database
                  ↓
       ┌──────────┼───────────┐
       ↓          ↓           ↓
    Calendar     Email     Scheduler
```

Each part has a different responsibility.

---

# 17. Frontend

The frontend is what the user interacts with.

Examples:

- Landing page
    
- Create Event page
    
- Availability page
    
- Dashboard
    
- Booking page
    
- Forms
    
- Buttons
    
- Calendar/time selection UI
    

For SyncLock, the frontend will eventually be built with **Next.js + TypeScript**.

---

# 18. Backend

The backend handles application logic.

Examples:

- Creating events
    
- Validating data
    
- Saving data
    
- Retrieving availability
    
- Calculating overlaps
    
- Creating bookings
    
- Updating bookings
    
- Triggering reminders
    
- Communicating with external services
    

Conceptually:

```text
Frontend
   ↓
Request
   ↓
Backend
   ↓
Validation
   ↓
Business Logic
   ↓
Database
   ↓
Response
   ↓
Frontend
```

---

# 19. Database

The database permanently stores application information.

SyncLock will use **PostgreSQL**.

Possible information:

```text
Users
Events
Participants
Dates
Time Slots
Availability
Bookings
Intake Responses
Reminders
Calendar Events
```

The database is basically the system's long-term memory.

---

# 20. External Services

SyncLock will eventually communicate with services outside the application.

Examples:

### Calendar

For creating/updating calendar events.

### Email

For confirmations and reminders.

### Scheduler

For running tasks at specific times.

Conceptually:

```text
                SyncLock
                   |
        ┌──────────┼──────────┐
        ↓          ↓          ↓
    PostgreSQL   Calendar    Email
                   |
                Scheduler
```

---

# 21. What Happens When a User Clicks "Create Event"?

This is one of the most important things to understand.

Suppose the organizer clicks:

**Create Event**

The conceptual flow is:

```text
1. User clicks button
          ↓
2. Frontend collects form data
          ↓
3. Frontend sends request
          ↓
4. Backend receives request
          ↓
5. Backend validates data
          ↓
6. Backend performs business logic
          ↓
7. Data is stored in PostgreSQL
          ↓
8. Backend sends response
          ↓
9. Frontend updates UI
```

The browser should not directly control the database.

---

# 22. Client vs Server

This distinction will become very important when building SyncLock.

## Client

Runs in the user's browser.

Responsible for things such as:

- UI
    
- User interactions
    
- Button clicks
    
- Form interactions
    
- Interactive availability selection
    

## Server

Runs outside the user's browser.

Responsible for:

- Database access
    
- Business logic
    
- Secure operations
    
- API handling
    
- External service communication
    

Simplified:

```text
Browser
(Client)
   ↓
Server
   ↓
Database
```

---

# 23. Why Can't Everything Run in the Browser?

Because the browser should not directly control sensitive server-side resources.

For example, you don't want:

```text
Browser
   ↓
Direct database access
```

Instead:

```text
Browser
   ↓
Backend/API
   ↓
Database
```

The backend acts as a controlled layer between the user and the database.

---

# 24. What is an API?

An API is a structured way for different parts of software to communicate.

For SyncLock:

```text
Frontend
   ↓
API Request
   ↓
Backend
```

For example, conceptually:

```text
POST /events
```

could mean:

> Create a new event.

Another endpoint might conceptually retrieve event information.

The exact API design will be decided later.

---

# 25. Why PostgreSQL?

SyncLock has strongly related structured data.

For example:

```text
User
 ↓
Event
 ↓
Participant
 ↓
Availability
 ↓
Booking
```

These relationships make a relational database such as PostgreSQL a natural fit.

PostgreSQL gives us:

- Tables
    
- Relationships
    
- Constraints
    
- Transactions
    
- Structured querying
    
- Data integrity
    

---

# 26. Why Prisma?

Prisma will act as the application's database access layer/ORM.

Conceptually:

```text
Next.js / Node.js
       ↓
     Prisma
       ↓
 PostgreSQL
```

Prisma helps the application work with PostgreSQL using TypeScript-friendly structures.

Important:

> **Prisma is not the database.**

PostgreSQL = database.

Prisma = tool used by the application to interact with the database.

---

# 27. What Exactly Is Availability?

This is one of the most important SyncLock concepts.

Availability is not simply:

> "Rahul is available."

It must answer:

> **Available when?**

For example:

```text
Participant: Rahul
Date: 25 September
Time: 11:30
Status: Available
```

Therefore availability is connected to a specific proposed date/time.

---

# 28. How Does Overlap Work Conceptually?

Suppose three participants submit:

```text
              10:00   10:30   11:00

Rahul          ✓       ✓       ✗
Priya          ✗       ✓       ✓
Aman           ✓       ✓       ✗
```

SyncLock checks each time slot.

### 10:00

```text
Rahul ✓
Priya ✗
Aman ✓
```

Not common.

### 10:30

```text
Rahul ✓
Priya ✓
Aman ✓
```

Common.

### 11:00

```text
Rahul ✗
Priya ✓
Aman ✗
```

Not common.

Therefore:

```text
Common availability = 10:30
```

This is the basic concept behind the overlap algorithm.

---

# 29. Why Timezones Matter

Time becomes complicated when users are in different locations.

Example:

```text
Organizer → India
Participant → USA
```

If the organizer says:

```text
10:00 AM IST
```

the participant should see the correct corresponding local time.

Otherwise, people could accidentally join at the wrong time.

Therefore SyncLock needs a proper strategy for:

- Timezones
    
- Date
    
- Start time
    
- End time
    
- Calendar conversions
    

A common approach is to store actual timestamps in a consistent format and convert them for display.

You don't need to implement this today.

You just need to understand:

> **Time is not simply a string like "10:00 AM".**

---

# 30. Availability vs Booking — Again

This is worth writing separately in your notes.

### Availability

A participant says:

> "I can attend during this slot."

### Booking

The organizer/system says:

> "This is the confirmed meeting."

Therefore:

```text
Availability
     ↓
Possible options
     ↓
Organizer chooses
     ↓
Booking
```

---

# 31. What Happens During Rescheduling?

Suppose:

```text
Booking
25 Sept — 11:30
```

gets changed to:

```text
26 Sept — 2:00
```

The system may need to update:

```text
Booking
   ↓
Calendar event
   ↓
Reminder
   ↓
Confirmation information
```

The important concept is:

> One change can affect multiple related pieces of data.

This is why good data modeling matters.

---

# 32. Automated Reminders

A reminder isn't simply:

```text
if user opens website:
    send reminder
```

The system needs something that can perform work at a future time.

Conceptually:

```text
Booking created
       ↓
Reminder scheduled
       ↓
Wait
       ↓
Scheduled time arrives
       ↓
Send reminder
       ↓
Mark reminder as sent
```

---

# 33. Why Idempotency Matters

Imagine the reminder system accidentally runs the same reminder job twice.

Without protection:

```text
Reminder
   ↓
Email sent
   ↓
Job runs again
   ↓
Same email sent again
```

The participant receives duplicate reminders.

A well-designed system should make important operations safe to repeat.

For example, the system can keep track of:

```text
reminder status
```

such as:

```text
pending
sent
failed
```

Then it can avoid sending the same reminder twice.

You don't need to implement this today.

Just understand the concept.

---

# 34. Initial SyncLock Database Entities

Your initial mental model contains these entities:

```text
User
Event
EventDate
TimeSlot
Participant
Availability
Booking
IntakeResponse
Reminder
CalendarEvent
```

At Day 1, these are **conceptual entities**, not your final database schema.

You'll properly design them on Day 3.

---

# 35. Conceptual Relationship Diagram

Put this in your notes:

```text
USER
 │
 │ creates
 ▼
EVENT
 │
 ├──── EVENT DATE
 │          │
 │          ▼
 │       TIME SLOT
 │          │
 │          ▼
 │     AVAILABILITY
 │          ▲
 │          │
 └──── PARTICIPANT
              │
              ▼
       INTAKE RESPONSE

EVENT
 │
 ▼
BOOKING
 │
 ├──── CALENDAR EVENT
 │
 └──── REMINDER
```

Again:

**This is a conceptual diagram, not the final database design.**

---

# 36. The Complete SyncLock Flow

This is probably the **single most important section of your Day 1 notes**.

Write it in your own words.

```text
Organizer
    ↓
Creates scheduling event
    ↓
Selects possible dates/times
    ↓
SyncLock stores event information
    ↓
Generates shareable link
    ↓
Participants open link
    ↓
Participants submit availability
    ↓
SyncLock stores availability
    ↓
System calculates overlapping availability
    ↓
Organizer sees possible common slots
    ↓
Organizer selects final slot
    ↓
Booking is created
    ↓
Participant intake information is collected
    ↓
Calendar event is created
    ↓
Confirmation is sent
    ↓
Reminder is scheduled
    ↓
Meeting takes place
    ↓
If cancelled/rescheduled:
related booking/calendar/reminder information is updated
```

---

# 37. The 12 Day 1 Questions

These are the questions you should be able to answer after studying today's notes.

### Q1. What is the difference between a Client Component and a Server Component?

**Answer:**  
A Client Component is used when the UI needs browser-side interactivity such as state, event handlers, effects, or browser APIs. A Server Component can render on the server and is useful for server-side work and accessing server-side resources. SyncLock will need both depending on the feature.

---

### Q2. What happens when the user clicks "Save Data"?

**Answer:**

```text
User interaction
      ↓
Frontend collects data
      ↓
Request sent to backend
      ↓
Backend validates data
      ↓
Business logic executes
      ↓
Database stores data
      ↓
Backend returns response
      ↓
Frontend updates UI
```

---

### Q3. Why PostgreSQL?

**Answer:**  
SyncLock contains structured and related information such as users, events, participants, availability and bookings. PostgreSQL is a relational database designed to handle structured data and relationships between records.

---

### Q4. What does Prisma do?

**Answer:**  
Prisma is an ORM/database access tool that allows the application to interact with PostgreSQL using TypeScript-friendly models and queries. It sits between the application and PostgreSQL.

---

### Q5. What is an API?

**Answer:**  
An API is a defined interface through which software components communicate. In SyncLock, the frontend can send requests to backend endpoints, which validate and process those requests and interact with the database.

---

### Q6. What exactly is availability?

**Answer:**  
Availability represents whether a particular participant can attend at a particular proposed date/time.

It is not simply:

> "Rahul is available."

It is:

> "Rahul is available at this specific proposed time."

---

### Q7. How is overlap calculated conceptually?

**Answer:**  
The system compares every participant's availability for each proposed time slot. A slot is a common available slot when the required participants are available during that slot.

---

### Q8. Why do timezones matter?

**Answer:**  
Different participants may be located in different timezones. A meeting scheduled at one timezone must be represented correctly for everyone. SyncLock therefore needs to handle timestamps and timezone conversions carefully.

---

### Q9. Availability vs Booking?

**Answer:**

**Availability:**  
A participant says they can attend.

**Booking:**  
The final meeting time has been confirmed.

```text
Availability
     ↓
Possible times
     ↓
Selection
     ↓
Booking
```

---

### Q10. What happens when a booking is cancelled or rescheduled?

**Answer:**  
The booking changes, and related systems may also need to change. Calendar events, reminders and confirmation information may need to be cancelled, updated or recreated.

---

### Q11. How do automated reminders work?

**Answer:**

```text
Booking created
      ↓
Reminder scheduled
      ↓
Scheduled time arrives
      ↓
Reminder job executes
      ↓
Message sent
      ↓
Reminder marked as processed
```

The system should also prevent duplicate execution where necessary.

---

### Q12. Explain the complete SyncLock flow.

**Answer:**

```text
Organizer creates event
        ↓
Selects possible dates/times
        ↓
Shares event link
        ↓
Participants join
        ↓
Participants submit availability
        ↓
Availability is stored
        ↓
Overlap is calculated
        ↓
Organizer chooses final time
        ↓
Booking created
        ↓
Intake information collected
        ↓
Calendar event created
        ↓
Confirmation sent
        ↓
Reminder scheduled
        ↓
Meeting
```

# ✅ Day 1 Completion Checklist

Before calling Day 1 complete:

-  I understand what SyncLock is
    
-  I understand the problem it solves
    
-  I understand the complete user journey
    
-  I understand organizer vs participant
    
-  I understand frontend vs backend
    
-  I understand what an API does
    
-  I understand why a database is needed
    
-  I understand why PostgreSQL is being considered
    
-  I understand what Prisma does
    
-  I understand availability
    
-  I understand overlap conceptually
    
-  I understand booking
    
-  I understand why timezones matter
    
-  I understand reminders
    
-  I understand cancellation/rescheduling propagation
    
-  I can explain the complete SyncLock flow without notes
    
-  I have written my own Day 1 notes
    
-  I have listed my remaining questions
    
