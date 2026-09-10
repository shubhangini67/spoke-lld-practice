import { AttemptStatus, ClassifierKind, RelationKind } from "@/domain/enums";
import { Attempt } from "@/domain/attempt";
import { emptyDesign, validateForSubmit, type Design } from "@/domain/design";
import { InvalidStateTransition, InvalidSubmission } from "@/domain/errors";
import { PROBLEMS } from "@/catalog/problems";
import { SAMPLES } from "@/catalog/samples";

export function parkingProblem() {
  return PROBLEMS.find((item) => item.id === "parking-lot")!;
}

export function stallDesign(): Design {
  return structuredClone(SAMPLES["parking-lot"]);
}

export function godClassDesign(): Design {
  return {
    clarifications: { floors: "multi", "pricing-now": "hourly" },
    types: [
      {
        name: "ParkingLot",
        kind: ClassifierKind.Class,
        responsibility: "Does everything: parks cars, prices tickets, and manages the system.",
        fields: ["spots", "tickets", "prices", "gates", "display", "clock"],
        methods: [
          "park",
          "unpark",
          "price",
          "pay",
          "print",
          "find",
          "count",
          "openGate",
          "closeGate",
        ],
      },
      {
        name: "Car",
        kind: ClassifierKind.Class,
        responsibility: "Holds a plate.",
        fields: ["plate"],
        methods: [],
      },
    ],
    relationships: [
      { source: "ParkingLot", target: "Car", kind: RelationKind.Uses, note: "" },
    ],
    walkthrough: [
      { actor: "ParkingLot", action: "park", collaborator: "Car", outcome: "parked" },
      { actor: "ParkingLot", action: "price", collaborator: "ParkingLot", outcome: "fee" },
      { actor: "ParkingLot", action: "pay", collaborator: "ParkingLot", outcome: "paid" },
    ],
    assumptions: ["One garage."],
    rejected: { approach: "Nothing", whyNot: "Did not consider another shape." },
    notes: "",
    code: "",
  };
}

export function thinDesign(): Design {
  const design = emptyDesign();
  design.types = [
    { name: "A", kind: ClassifierKind.Class, responsibility: "", fields: [], methods: [] },
  ];
  return design;
}

export { Attempt, AttemptStatus, InvalidStateTransition, InvalidSubmission, validateForSubmit };
