import { ClassifierKind, RelationKind } from "@/domain/enums";
import type { Design } from "@/domain/design";

export const SAMPLES: Record<string, Design> = {
  "vending-machine": {
    clarifications: { tender: "multi", hardware: "abstracted" },
    types: [
      {
        name: "MachineController",
        kind: ClassifierKind.Class,
        responsibility: "Owns the current machine state and sequences select, pay, and dispense.",
        fields: ["state: MachineState", "catalog: Inventory", "tender: PaymentPort"],
        methods: ["select(code)", "insert(amount)", "cancel()", "confirm()"],
      },
      {
        name: "MachineState",
        kind: ClassifierKind.Interface,
        responsibility: "Represents idle, collecting, dispensing, or jammed, and the legal next events.",
        fields: [],
        methods: ["onSelect()", "onPayment()", "onCancel()"],
      },
      {
        name: "Inventory",
        kind: ClassifierKind.Class,
        responsibility: "Tracks stock and price per slot, and decrements only after a successful vend.",
        fields: ["slots: Map<code, Slot>"],
        methods: ["available(code)", "price(code)", "decrement(code)"],
      },
      {
        name: "PaymentPort",
        kind: ClassifierKind.Interface,
        responsibility: "Collects value and returns change without the controller knowing coins vs card.",
        fields: [],
        methods: ["credit(amount)", "balance()", "refund()", "capture(price)"],
      },
      {
        name: "CoinBox",
        kind: ClassifierKind.Class,
        responsibility: "Implements PaymentPort for cash and computes change from inserted coins.",
        fields: ["inserted: number"],
        methods: ["credit()", "refund()", "capture()"],
      },
      {
        name: "DispenserPort",
        kind: ClassifierKind.Interface,
        responsibility: "Releases a physical item. The domain talks to this, not to motors.",
        fields: [],
        methods: ["release(code)"],
      },
    ],
    relationships: [
      { source: "MachineController", target: "MachineState", kind: RelationKind.Uses, note: "current state" },
      { source: "MachineController", target: "Inventory", kind: RelationKind.Composes, note: "" },
      { source: "MachineController", target: "PaymentPort", kind: RelationKind.Uses, note: "" },
      { source: "MachineController", target: "DispenserPort", kind: RelationKind.Uses, note: "" },
      { source: "CoinBox", target: "PaymentPort", kind: RelationKind.Implements, note: "" },
    ],
    walkthrough: [
      {
        actor: "MachineController",
        action: "select",
        collaborator: "Inventory",
        outcome: "Slot is in stock; controller moves to collecting.",
      },
      {
        actor: "MachineController",
        action: "credit coins",
        collaborator: "PaymentPort",
        outcome: "Balance covers price.",
      },
      {
        actor: "MachineController",
        action: "capture and release",
        collaborator: "DispenserPort",
        outcome: "Item vends; inventory decrements; change refunded if needed.",
      },
    ],
    assumptions: [
      "One buyer at a time. No concurrent selections.",
      "Prices are integers. Hardware failures surface as jammed state.",
    ],
    rejected: {
      approach: "One VendingMachine class with booleans for hasSelection/hasPayment and a switch on item code.",
      whyNot:
        "A promo or a card reader would both edit the same class. PaymentPort and Inventory keep those axes independent.",
    },
    notes: "Card payments later become a second PaymentPort implementation.",
    code: "",
  },
  "parking-lot": {
    clarifications: { floors: "multi", "pricing-now": "hourly" },
    types: [
      {
        name: "Garage",
        kind: ClassifierKind.Class,
        responsibility: "Coordinates entry and exit. Does not compute fees or know spot internals.",
        fields: ["floors: Floor[]", "pricing: FeePolicy", "clock: Clock"],
        methods: ["enter(vehicle)", "leave(sessionId)"],
      },
      {
        name: "Floor",
        kind: ClassifierKind.Class,
        responsibility: "Owns stalls on one level and reports occupancy for that level.",
        fields: ["stalls: Stall[]", "level: number"],
        methods: ["findFit(vehicle)", "occupancy()", "availableCount()"],
      },
      {
        name: "Stall",
        kind: ClassifierKind.Class,
        responsibility: "Knows its size, whether it is free, and the vehicle currently occupying it.",
        fields: ["size", "occupiedBy"],
        methods: ["fits(vehicle)", "occupy()", "release()"],
      },
      {
        name: "Vehicle",
        kind: ClassifierKind.Abstract,
        responsibility: "Supplies the size needed to choose a compatible stall.",
        fields: ["id", "size"],
        methods: ["size()"],
      },
      {
        name: "Stay",
        kind: ClassifierKind.Class,
        responsibility: "Session opened at entry and closed at exit with timestamps.",
        fields: ["id", "stall", "enteredAt", "exitedAt"],
        methods: ["close(at)"],
      },
      {
        name: "FeePolicy",
        kind: ClassifierKind.Interface,
        responsibility: "Computes a fee from a closed stay so peak pricing can replace hourly later.",
        fields: [],
        methods: ["fee(stay)"],
      },
    ],
    relationships: [
      { source: "Garage", target: "Floor", kind: RelationKind.Composes, note: "" },
      { source: "Floor", target: "Stall", kind: RelationKind.Composes, note: "" },
      { source: "Garage", target: "FeePolicy", kind: RelationKind.Uses, note: "" },
      { source: "Garage", target: "Stay", kind: RelationKind.Uses, note: "issues on enter" },
      { source: "Stall", target: "Vehicle", kind: RelationKind.Uses, note: "" },
    ],
    walkthrough: [
      {
        actor: "Garage",
        action: "find a fitting stall",
        collaborator: "Floor",
        outcome: "A free stall that fits the truck is chosen.",
      },
      {
        actor: "Floor",
        action: "occupy",
        collaborator: "Stall",
        outcome: "Stall is marked taken; a Stay is opened.",
      },
      {
        actor: "Garage",
        action: "fee then release",
        collaborator: "FeePolicy",
        outcome: "Hourly fee is computed; stall is freed; occupancy drops.",
      },
    ],
    assumptions: [
      "Assignment is first-fit across floors from the bottom.",
      "Clock is injected so fees are testable.",
    ],
    rejected: {
      approach: "A ParkingLot god class that stores a 2D array of spots and a switch on vehicleType for money.",
      whyNot:
        "Peak-hour pricing and EV stalls would both edit ParkingLot. FeePolicy and Stall keep those changes local.",
    },
    notes: "EV follow-up: a ChargingStall subtype or a feature on Stall, plus a FeePolicy decorator for kWh.",
    code: "",
  },
};
