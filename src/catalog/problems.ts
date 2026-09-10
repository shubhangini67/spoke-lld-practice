import { Difficulty } from "@/domain/enums";
import type { Problem } from "@/domain/problem";

function problem(input: Problem): Problem {
  return input;
}

export const PROBLEMS: Problem[] = [
  problem({
    id: "vending-machine",
    title: "Vending Machine",
    difficulty: Difficulty.Easy,
    minutes: 25,
    summary: "Select, pay, and dispense without turning the machine into one class that owns money, stock, and state.",
    scenario:
      "A small office vending machine sells snacks at fixed prices. A user picks an item, inserts money, and either gets the item plus change or gets their money back. Stock runs out. Prices and payment methods will change.",
    requirements: [
      "Show which items are available and at what price.",
      "Accept payment, reject if funds are short, return change.",
      "Dispense only when paid and in stock, then decrement inventory.",
      "Allow cancel before dispense and refund the inserted amount.",
      "Keep the machine from dispensing while it is empty or jammed.",
    ],
    constraints: [
      "Do not hard-code a single payment type as the only future option.",
      "Inventory and payment should be able to change independently.",
      "Avoid a VendingMachine god class that also prices, stores, and talks to hardware.",
    ],
    capabilities: [
      {
        id: "selection",
        title: "Item selection with availability",
        description: "A user can choose a product and the design knows whether it can be sold.",
        signals: ["select", "item", "product", "slot", "catalog", "available", "inventory", "stock"],
        weight: 1,
      },
      {
        id: "payment",
        title: "Payment and change",
        description: "Inserted value is tracked, shortfalls are rejected, change can be returned.",
        signals: ["pay", "payment", "coin", "cash", "balance", "change", "refund", "insert"],
        weight: 1.2,
      },
      {
        id: "dispense",
        title: "Guarded dispense",
        description: "Dispense happens only after a valid paid selection and updates stock.",
        signals: ["dispense", "release", "vend", "deliver"],
        weight: 1,
      },
      {
        id: "state",
        title: "Machine state you can point at",
        description: "Idle, collecting money, dispensing, and out-of-order are not a pile of booleans on one class.",
        signals: ["state", "idle", "ready", "collecting"],
        seamSignals: ["state", "status"],
        weight: 1.1,
      },
      {
        id: "replaceable-pricing",
        title: "Replaceable pricing",
        description: "A price change or a new promo does not rewrite the machine.",
        signals: ["price", "pricing", "catalog", "cost"],
        seamSignals: ["strategy", "policy", "pricer"],
        weight: 0.9,
      },
      {
        id: "card-payments",
        title: "Card or wallet payment",
        description: "Payment is behind a seam so card/wallet can land without rewriting coin logic.",
        signals: ["card", "wallet", "tender", "payment method", "processor"],
        seamSignals: ["payment", "tender", "processor"],
        weight: 1,
        activatedBy: { questionId: "tender", optionId: "multi" },
      },
    ],
    questions: [
      {
        id: "tender",
        prompt: "What kinds of payment does v1 accept?",
        whyItMatters: "If payment is only coins, a CoinBox may be enough. If cards arrive next quarter, payment needs a seam now.",
        options: [
          {
            id: "coins",
            label: "Coins only",
            implication: "A dedicated cash handler is fine. Still keep pricing out of it.",
          },
          {
            id: "multi",
            label: "Coins now, cards soon",
            implication: "Payment should sit behind an interface so a second tender does not edit the machine.",
          },
        ],
      },
      {
        id: "hardware",
        prompt: "Do we model the physical motors and sensors?",
        whyItMatters: "Hardware I/O is a boundary. Folding it into business rules makes the design untestable.",
        options: [
          {
            id: "abstracted",
            label: "Abstract dispensers and coin hardware",
            implication: "Talk to ports. The domain should not import GPIO.",
          },
          {
            id: "ignore",
            label: "Ignore hardware, in-memory only",
            implication: "Still separate inventory from payment. Tests should not need a motor.",
          },
        ],
      },
    ],
    followUp: {
      title: "Add a promo: buy two, get the second half off",
      prompt:
        "The operator wants a weekend promo without editing the dispense path. Where does the discount live, and what existing type stays untouched?",
      whatItTests: "Whether pricing is a seam or a switch inside the machine.",
    },
    evaluatorNotes: [
      "A strong design usually separates inventory, payment, and a small state/controller.",
      "State pattern is valid; a clean enum plus guarded transitions is also valid.",
      "Do not require the name VendingMachine or Item.",
    ],
    tags: ["state", "strategy", "classic"],
  }),
  problem({
    id: "parking-lot",
    title: "Parking Lot",
    difficulty: Difficulty.Medium,
    minutes: 40,
    summary: "Assign compatible spots, issue a session, and charge on the way out without a ParkingLot god class.",
    scenario:
      "A city garage takes cars, bikes, and trucks. Drivers enter, take a ticket, park, then pay to leave. Spot sizes differ. Pricing will later include peak hours and monthly passes. The operator may add EV stalls.",
    requirements: [
      "Admit a vehicle only into a spot that fits it.",
      "Issue something on entry that is closed on exit with a fee.",
      "Know occupancy, ideally per floor if you scoped multiple floors.",
      "Find a free compatible spot without scanning the universe forever.",
      "Keep assignment and fee calculation independently changeable.",
    ],
    constraints: [
      "Do not assume one pricing formula will last.",
      "Avoid a single type that parks, prices, and prints receipts.",
      "New vehicle types should not require rewriting the lot.",
    ],
    capabilities: [
      {
        id: "assignment",
        title: "Compatible spot assignment",
        description: "Vehicles land only in spots that fit. Assignment is a responsibility you can point at.",
        signals: ["assign", "spot", "stall", "slot", "available", "fit", "size", "park"],
        weight: 1.2,
      },
      {
        id: "vehicles",
        title: "Vehicle variation",
        description: "Different vehicles are a model, not a stringly-typed if-else inside the lot.",
        signals: ["vehicle", "car", "bike", "truck", "size", "type"],
        seamSignals: ["vehicle"],
        weight: 1,
      },
      {
        id: "session",
        title: "Entry and exit session",
        description: "Entry opens a ticket/session; exit closes it and records duration.",
        signals: ["ticket", "session", "entry", "exit", "leave", "unpark"],
        weight: 1,
      },
      {
        id: "pricing",
        title: "Replaceable pricing",
        description: "Hourly, peak, or pass pricing can land without editing the lot.",
        signals: ["fee", "price", "fare", "rate", "charge", "payment"],
        seamSignals: ["strategy", "policy", "pricing", "tariff"],
        weight: 1.2,
      },
      {
        id: "occupancy",
        title: "Occupancy you can report",
        description: "The design can answer how full the garage is.",
        signals: ["occupancy", "available", "capacity", "count", "display"],
        weight: 0.8,
      },
      {
        id: "floors",
        title: "Multi-floor structure",
        description: "Floors exist as a real concept, not a number on a god class.",
        signals: ["floor", "level", "storey", "deck"],
        weight: 1,
        activatedBy: { questionId: "floors", optionId: "multi" },
      },
    ],
    questions: [
      {
        id: "floors",
        prompt: "How is the garage physically laid out?",
        whyItMatters: "A single slab is a list of spots. Multiple floors usually want a Floor (or equivalent) that owns spots.",
        options: [
          {
            id: "single",
            label: "One level",
            implication: "A collection of spots is enough. Do not invent floors you will not use.",
          },
          {
            id: "multi",
            label: "Several floors",
            implication: "Spot search should be able to walk floors. Occupancy per floor becomes visible.",
          },
        ],
      },
      {
        id: "pricing-now",
        prompt: "What is pricing in v1?",
        whyItMatters: "Flat fees can live on the spot type. Time-based fees need a clock and a policy object.",
        options: [
          {
            id: "flat",
            label: "Flat fee by vehicle size",
            implication: "A simple policy is fine, but keep it out of the lot so peak hours can land later.",
          },
          {
            id: "hourly",
            label: "Hourly, with peak hours coming",
            implication: "Pricing must be a seam. The lot should not compute money.",
          },
        ],
      },
    ],
    followUp: {
      title: "Add EV charging stalls",
      prompt:
        "Some stalls now supply power and charge a kWh rate on top of parking. Which types change, and which stay still?",
      whatItTests: "Whether spots and pricing were actually separable.",
    },
    evaluatorNotes: [
      "Stall is as valid as ParkingSpot. Session is as valid as Ticket.",
      "A factory for vehicles is optional. A type hierarchy or composition both work.",
      "Concurrency at two gates is a plus, not required for a solid attempt.",
    ],
    tags: ["classic", "strategy", "allocation"],
  }),
  problem({
    id: "meeting-rooms",
    title: "Meeting Room Scheduler",
    difficulty: Difficulty.Medium,
    minutes: 35,
    summary: "Book rooms without overlapping, and keep calendar rules out of the Room class.",
    scenario:
      "An office has rooms with different capacities and equipment. People book a room for an interval. Double-booking is forbidden. Later we may add recurring meetings, waitlists, and room features like a whiteboard or video bar.",
    requirements: [
      "Find rooms free for a time window and party size.",
      "Create a booking that cannot overlap another booking on the same room.",
      "Cancel a booking and free the slot.",
      "Inspect a room's day without leaking every other room's calendar.",
      "Keep search and conflict rules testable without a UI.",
    ],
    constraints: [
      "Do not store bookings as a boolean grid on the Room if a calendar object would isolate the rule.",
      "Time intervals are the hard part. Get overlap right.",
      "Avoid a Scheduler god class that also emails, bills, and renders the UI.",
    ],
    capabilities: [
      {
        id: "search",
        title: "Availability search",
        description: "The design can answer which rooms fit a window and capacity.",
        signals: ["search", "available", "find", "free", "query", "capacity"],
        weight: 1.1,
      },
      {
        id: "conflict",
        title: "Overlap rejection",
        description: "Two bookings on one room cannot share time. The invariant lives somewhere specific.",
        signals: ["overlap", "conflict", "interval", "slot", "booking", "reservation"],
        weight: 1.3,
      },
      {
        id: "booking-lifecycle",
        title: "Book and cancel",
        description: "A booking is created and can be cancelled, freeing the room.",
        signals: ["book", "cancel", "reservation", "booking", "release"],
        weight: 1,
      },
      {
        id: "room-model",
        title: "Room as more than a name",
        description: "Capacity and features belong to the room, not to a string in the scheduler.",
        signals: ["room", "capacity", "feature", "equipment", "whiteboard"],
        weight: 0.8,
      },
      {
        id: "recurring",
        title: "Recurring meetings",
        description: "A series can expand into occurrences without copy-pasting bookings by hand.",
        signals: ["recurring", "series", "rrule", "weekly", "occurrence"],
        weight: 1.1,
        activatedBy: { questionId: "recurrence", optionId: "yes" },
      },
    ],
    questions: [
      {
        id: "recurrence",
        prompt: "Do we need recurring meetings in v1?",
        whyItMatters: "Recurrence explodes complexity. If it is in, you need a series vs occurrence split. If not, say so out loud.",
        options: [
          {
            id: "no",
            label: "One-off bookings only",
            implication: "A booking with a start and end is enough. Do not over-model RRULE.",
          },
          {
            id: "yes",
            label: "Weekly series in v1",
            implication: "Separate the series from a single occurrence so a one-off cancel does not delete the series.",
          },
        ],
      },
      {
        id: "timezone",
        prompt: "Are all rooms in one timezone?",
        whyItMatters: "A single office can use naive local time. Multi-city rooms need an explicit clock.",
        options: [
          {
            id: "one",
            label: "One office, one timezone",
            implication: "Document that. Intervals can be local datetimes.",
          },
          {
            id: "multi",
            label: "Rooms in more than one city",
            implication: "Store instants or attach a timezone to the room. Do not compare civil times across cities.",
          },
        ],
      },
    ],
    followUp: {
      title: "Add a waitlist when the room is busy",
      prompt:
        "If a booking is cancelled, the next waiter gets the slot. Who owns the waitlist, and what does Room still not know?",
      whatItTests: "Whether booking policy is a separate object or jammed into Room.",
    },
    evaluatorNotes: [
      "Interval overlap is the invariant. A Calendar, Schedule, or BookingWindow type is a good sign.",
      "Do not require a class named MeetingRoomScheduler.",
      "Recurrence is only scored if the learner opted into it.",
    ],
    tags: ["intervals", "invariants", "search"],
  }),
  problem({
    id: "cache",
    title: "In-memory Cache",
    difficulty: Difficulty.Medium,
    minutes: 35,
    summary: "Get, put, evict. Policy must be replaceable so LRU is not baked into the map.",
    scenario:
      "A service needs a bounded in-memory cache. Callers get and put entries. When the cache is full, something has to leave. Some entries should expire. Later we may switch LRU to LFU, or add a write-through store.",
    requirements: [
      "Get returns a value or a miss.",
      "Put inserts or updates and may trigger eviction at capacity.",
      "Capacity is a real limit, not a comment.",
      "TTL entries expire and are treated as misses.",
      "Eviction policy can change without rewriting the cache map.",
    ],
    constraints: [
      "Do not put LRU pointers inside a giant Cache class if a policy object would isolate them.",
      "Expiry and eviction are different reasons an entry disappears.",
      "Thread safety is a follow-up unless you choose to include it now.",
    ],
    capabilities: [
      {
        id: "map",
        title: "Get and put",
        description: "The cache can store and retrieve entries by key.",
        signals: ["get", "put", "set", "key", "value", "entry"],
        weight: 1,
      },
      {
        id: "capacity",
        title: "Bounded capacity",
        description: "A max size exists and put respects it.",
        signals: ["capacity", "max", "size", "bound", "limit"],
        weight: 1,
      },
      {
        id: "eviction",
        title: "Replaceable eviction",
        description: "LRU (or similar) is a policy, not a nest of pointers only the cache understands.",
        signals: ["evict", "lru", "lfu", "policy", "victim"],
        seamSignals: ["strategy", "policy", "eviction"],
        weight: 1.3,
      },
      {
        id: "ttl",
        title: "Time-to-live",
        description: "Expired entries miss, even if they were not the eviction victim.",
        signals: ["ttl", "expire", "expiry", "deadline", "clock"],
        weight: 1.1,
      },
      {
        id: "clock",
        title: "Clock as a dependency",
        description: "Time is injected so expiry is testable.",
        signals: ["clock", "time", "now", "ticker"],
        weight: 0.7,
      },
    ],
    questions: [
      {
        id: "policy",
        prompt: "Which eviction policy is v1?",
        whyItMatters: "Naming LRU is not the point. The point is whether a second policy can land.",
        options: [
          {
            id: "lru",
            label: "LRU now, LFU later",
            implication: "Put eviction behind an interface. Linked-list + map is fine as the LRU implementation.",
          },
          {
            id: "lfu",
            label: "LFU now",
            implication: "Frequency counting should not leak into every get caller. Keep it in the policy.",
          },
        ],
      },
      {
        id: "store",
        prompt: "Is this cache-only, or a window onto a store?",
        whyItMatters: "A pure cache is simpler. Write-through needs a port to a backing store.",
        options: [
          {
            id: "memory",
            label: "Pure in-memory",
            implication: "No persistence port required. Still inject a clock.",
          },
          {
            id: "writethrough",
            label: "Write-through to a store",
            implication: "Cache talks to a Store port. Do not import Postgres into the eviction policy.",
          },
        ],
      },
    ],
    followUp: {
      title: "Make get/put safe under two threads",
      prompt:
        "Two threads put the last slot at once. What is shared mutable state, and which lock (or concurrent structure) sits where — without freezing the whole process?",
      whatItTests: "Whether you can name the shared state instead of sprinkling synchronized on every method.",
    },
    evaluatorNotes: [
      "A Cache that IS an LRU list is weaker than a Cache that HAS an EvictionPolicy.",
      "Clock injection is a strong signal for TTL.",
      "Do not require the name LRUCache.",
    ],
    tags: ["strategy", "ttl", "concurrency-followup"],
  }),
  problem({
    id: "elevator",
    title: "Elevator",
    difficulty: Difficulty.Hard,
    minutes: 45,
    summary: "Hall calls, car calls, and movement. Dispatch is the design, not a while-loop in Elevator.",
    scenario:
      "A building has one or more lifts. People press hall buttons and floor buttons inside the car. The system should move, open doors, and not strand requests. Later we may add peak-hour policies or a freight car with different rules.",
    requirements: [
      "Accept hall calls (up/down at a floor) and car calls (destination inside the car).",
      "Move the car, open and close doors, and complete calls.",
      "Do not drop requests just because the car passed the floor in the other direction.",
      "If you scoped multiple cars, dispatch should pick one without every car knowing every other car.",
      "Keep motion state explicit: idle, moving, loading.",
    ],
    constraints: [
      "A single Elevator class that stores queues, motors, and dispatch for a whole bank is a smell.",
      "Direction and pending calls are the heart of the model.",
      "Real-time hardware is out of scope; a clocked step() or event loop is enough.",
    ],
    capabilities: [
      {
        id: "calls",
        title: "Hall and car calls",
        description: "Outside requests and inside destinations are both first-class.",
        signals: ["hall", "car", "call", "request", "button", "destination"],
        weight: 1.2,
      },
      {
        id: "motion",
        title: "Motion and doors",
        description: "The car has a floor, a direction, and door state you can name.",
        signals: ["move", "direction", "door", "floor", "idle", "state"],
        weight: 1.1,
      },
      {
        id: "scheduling",
        title: "Request scheduling",
        description: "Pending calls are ordered with an explicit policy, not a lucky array.",
        signals: ["queue", "schedule", "pending", "scan", "look", "dispatch"],
        seamSignals: ["strategy", "controller", "scheduler", "dispatcher"],
        weight: 1.3,
      },
      {
        id: "completion",
        title: "Calls complete",
        description: "Serving a floor removes the call. Missed calls stay alive.",
        signals: ["complete", "served", "arrive", "stop", "clear"],
        weight: 0.9,
      },
      {
        id: "bank",
        title: "Multi-car dispatch",
        description: "A controller assigns a hall call to a car. Cars do not all fight over the same button.",
        signals: ["bank", "dispatch", "controller", "assign", "fleet", "car"],
        weight: 1.2,
        activatedBy: { questionId: "cars", optionId: "bank" },
      },
    ],
    questions: [
      {
        id: "cars",
        prompt: "How many cars in v1?",
        whyItMatters: "One car is a state machine plus a queue. A bank needs a dispatcher that does not live inside each car.",
        options: [
          {
            id: "one",
            label: "Single car",
            implication: "Focus on direction, hall vs car calls, and a SCAN-like policy. Do not fake a bank.",
          },
          {
            id: "bank",
            label: "A bank of cars",
            implication: "Introduce a dispatcher. Cars should not each own the global hall-button board.",
          },
        ],
      },
      {
        id: "policy",
        prompt: "What movement policy are you defending?",
        whyItMatters: "SCAN/LOOK vs nearest-car is a trade-off you should say out loud.",
        options: [
          {
            id: "scan",
            label: "SCAN / LOOK (continue in direction)",
            implication: "Keep moving in one direction while calls exist that way. Good default for interviews.",
          },
          {
            id: "nearest",
            label: "Nearest idle car (or nearest floor)",
            implication: "Simple, can starve. Fine if you name the starvation risk.",
          },
        ],
      },
    ],
    followUp: {
      title: "Morning up-peak: ignore down hall calls for 20 minutes",
      prompt:
        "Where does that policy live so you do not edit the car's door logic? What still happens to a down call — queue, reject, or reroute?",
      whatItTests: "Whether scheduling is a replaceable policy.",
    },
    evaluatorNotes: [
      "ElevatorController vs ElevatorCar is a common split, not a required naming.",
      "A Direction enum plus pending sets is often cleaner than four boolean flags.",
      "Multi-car is only scored if the learner opted into a bank.",
    ],
    tags: ["state", "scheduling", "hard"],
  }),
];

export function getProblem(id: string): Problem | undefined {
  return PROBLEMS.find((item) => item.id === id);
}
