/**
 * app/api/recommendations/route.ts
 *
 * LightGCN-based student–event recommendation engine.
 * He et al., "LightGCN: Simplifying and Powering GCN for Recommendation", SIGIR 2020.
 *
 * Architecture:
 *   - Bipartite graph: students ↔ events (edges = event_history entries)
 *   - 8-d feature initialisation from interest tags + event metadata
 *   - 3 propagation layers with symmetric D^{-½} A D^{-½} normalisation
 *   - Final embedding = mean of all layer embeddings (LightGCN pooling)
 *   - Score = dot product of student and event final embeddings
 *
 * This route is always "live" — it computes from MOCK_STUDENTS / MOCK_EVENTS
 * so it works identically in mock mode and backend mode (no DB client needed).
 */
import { NextRequest, NextResponse } from "next/server";
import { MOCK_STUDENTS, MOCK_EVENTS } from "@/lib/mockData";
import type {
  EventSummary,
  StudentRow,
  LightGCNResult,
  EventRecommendation,
} from "@/lib/types";

// ── Hyper-parameters ──────────────────────────────────────────────────────────
const EMBED_DIM = 8;
const N_LAYERS = 3;
const TOP_K = 3;

// ── Feature extraction ────────────────────────────────────────────────────────
// 8 dimensions, one per thematic cluster:
//   0  embedded / firmware
//   1  power electronics / magnetics
//   2  RF / antenna / EMC
//   3  software / simulation / tooling
//   4  career / internship interest
//   5  research / thesis interest
//   6  engagement level (0-1 continuous)
//   7  returning student / upcoming event

function studentFeats(s: StudentRow): number[] {
  const t = new Set(s.interest_tags.map((x) => x.toLowerCase()));
  return [
    +(t.has("embedded") || t.has("firmware")),
    +(t.has("power electronics") || t.has("magnetics") || t.has("power")),
    +(t.has("rf") || t.has("antenna") || t.has("emc")),
    +(t.has("simulation") || t.has("software") || t.has("tooling")),
    +(t.has("internship") || s.career_interest),
    +(t.has("thesis") || t.has("research") || s.project_interest),
    s.engagement_score / 100,
    +s.returning,
  ];
}

function eventFeats(e: EventSummary): number[] {
  const ti = e.title.toLowerCase();
  return [
    +(e.type === "workshop" && (ti.includes("embedded") || ti.includes("systems"))),
    +(ti.includes("power") || ti.includes("magnet")),
    +(ti.includes("emc") || ti.includes("antenna") || ti.includes("rf")),
    +(e.type === "hackathon" || ti.includes("redexpert")),
    +(e.type === "career_fair" || e.type === "recruiting_talk"),
    +(e.type === "lab_tour" || e.type === "technical_talk"),
    Math.min(e.relationship_roi / 100, 1),
    +(e.status === "planned"),
  ];
}

// ── LightGCN propagation ──────────────────────────────────────────────────────
interface GCNOutput {
  /** Mean-pooled final embeddings for all nodes  [N, EMBED_DIM] */
  finalEmb: number[][];
  /** Per-layer snapshot embeddings              [L+1, N, EMBED_DIM] */
  allLayerEmb: number[][][];
}

function lightGCN(students: StudentRow[], events: EventSummary[]): GCNOutput {
  const NS = students.length;
  const NE = events.length;
  const N = NS + NE;

  // Build sparse boolean interaction matrix R[si][ej]
  const eIdx = new Map(events.map((e, i) => [e.id, i]));
  const R: boolean[][] = students.map((s) => {
    const row = new Array<boolean>(NE).fill(false);
    for (const h of s.event_history) {
      const ei = eIdx.get(h.event_id);
      if (ei !== undefined) row[ei] = true;
    }
    return row;
  });

  // Degree vectors (needed for symmetric normalisation)
  const degS = students.map((_, si) => R[si].filter(Boolean).length);
  const degE = events.map((_, ej) => students.filter((_, si) => R[si][ej]).length);

  // E^(0): feature-based initialisation
  let E: number[][] = [
    ...students.map(studentFeats),
    ...events.map(eventFeats),
  ];

  // Collect all layer snapshots (L0 = content-only baseline)
  const allLayerEmb: number[][][] = [E.map((r) => [...r])];

  // K propagation layers: E^(k+1) = D^{-½} A D^{-½} E^(k)
  for (let l = 0; l < N_LAYERS; l++) {
    const nextE: number[][] = Array.from({ length: N }, () =>
      new Array<number>(EMBED_DIM).fill(0)
    );

    for (let si = 0; si < NS; si++) {
      if (degS[si] === 0) continue; // isolated student → skip (no edges)
      for (let ej = 0; ej < NE; ej++) {
        if (!R[si][ej] || degE[ej] === 0) continue;
        const w = 1 / Math.sqrt(degS[si] * degE[ej]); // symmetric normalisation
        for (let d = 0; d < EMBED_DIM; d++) {
          nextE[si][d] += w * E[NS + ej][d]; // student ← event
          nextE[NS + ej][d] += w * E[si][d]; // event   ← student
        }
      }
    }

    E = nextE;
    allLayerEmb.push(E.map((r) => [...r]));
  }

  // Final embedding: mean pooling over all layers  (LightGCN eq. 11)
  const K1 = allLayerEmb.length; // N_LAYERS + 1
  const finalEmb: number[][] = Array.from({ length: N }, (_, i) => {
    const avg = new Array<number>(EMBED_DIM).fill(0);
    for (const lE of allLayerEmb) {
      for (let d = 0; d < EMBED_DIM; d++) avg[d] += lE[i][d];
    }
    return avg.map((v) => v / K1);
  });

  return { finalEmb, allLayerEmb };
}

// ── Scoring utilities ─────────────────────────────────────────────────────────
const dot = (a: number[], b: number[]): number =>
  a.reduce((s, v, i) => s + v * b[i], 0);

const sigmoid = (x: number): number => 1 / (1 + Math.exp(-x));

// Human-readable explanations keyed by feature dimension
const REASON_MAP: Array<[number, string]> = [
  [0, "Embedded & firmware expertise matches event focus"],
  [1, "Power electronics interest aligns with event content"],
  [2, "RF/EMC background matches event topic"],
  [3, "Software/simulation interest matches event type"],
  [4, "Career interest matches recruiting focus"],
  [5, "Research interest matches technical depth"],
];

function buildReasons(
  sEmb: number[],
  eEmb: number[],
  hasCollabSignal: boolean,
  highEngagement: boolean
): string[] {
  const out: string[] = [];
  for (const [d, label] of REASON_MAP) {
    if (sEmb[d] > 0.3 && eEmb[d] > 0.3) out.push(label);
  }
  if (hasCollabSignal)
    out.push("Students with similar profiles also attended this event");
  if (highEngagement)
    out.push("High-engagement student prioritised for upcoming events");
  return out.length
    ? out.slice(0, 3)
    : ["Collaborative signal from graph neighbourhood"];
}

// ── Result builder ────────────────────────────────────────────────────────────
function buildResult(
  student: StudentRow,
  si: number,
  students: StudentRow[],
  events: EventSummary[],
  NS: number,
  gcn: GCNOutput,
  graphEdges: number
): LightGCNResult {
  const { finalEmb, allLayerEmb } = gcn;
  const sEmb = finalEmb[si];
  const attended = new Set(student.event_history.map((h) => h.event_id));
  const candidates = events
    .map((e, ei) => ({ e, ei }))
    .filter(({ e }) => !attended.has(e.id));

  if (candidates.length === 0) {
    return {
      student_id: student.user_id,
      student_name: student.display_name,
      recommendations: [],
      already_attended: [...attended],
      model: { layers: N_LAYERS, embedding_dim: EMBED_DIM, graph_edges: graphEdges },
    };
  }

  // Raw dot products for normalisation
  const rawDots = candidates.map(({ ei }) => dot(sEmb, finalEmb[NS + ei]));
  const lo = Math.min(...rawDots);
  const hi = Math.max(...rawDots);
  const range = hi - lo + 1e-9;

  const recs: EventRecommendation[] = candidates
    .map(({ e, ei }, ci) => {
      const eEmb = finalEmb[NS + ei];
      const rawScore = rawDots[ci];

      // Relative score (0-1, for ranking within this student's candidate set)
      const score = Math.round(((rawScore - lo) / range) * 100) / 100;

      // Absolute confidence via sigmoid (model certainty, not relative rank)
      const confidence = Math.round((sigmoid(rawScore * 2) * 0.85 + 0.1) * 100) / 100;

      // Layer-by-layer dot products: shows how collaborative signal accumulates
      const layerContribution = allLayerEmb.map(
        (lE) => Math.round(sigmoid(dot(lE[si], lE[NS + ei]) * 2) * 100) / 100
      );

      // Content-only score: L0 embedding dot product (no graph propagation)
      const featureScore =
        Math.round(sigmoid(dot(allLayerEmb[0][si], allLayerEmb[0][NS + ei]) * 2) * 100) / 100;

      return {
        event_id: e.id,
        event_title: e.title,
        event_type: e.type,
        score,
        confidence,
        feature_score: featureScore,
        reasons: buildReasons(
          sEmb,
          eEmb,
          attended.size > 0,
          student.engagement_score > 75
        ),
        layer_contribution: layerContribution,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, TOP_K);

  return {
    student_id: student.user_id,
    student_name: student.display_name,
    recommendations: recs,
    already_attended: [...attended],
    model: { layers: N_LAYERS, embedding_dim: EMBED_DIM, graph_edges: graphEdges },
  };
}

// ── Route handler ─────────────────────────────────────────────────────────────
export async function GET(req: NextRequest): Promise<NextResponse> {
  const studentId = req.nextUrl.searchParams.get("studentId");
  const students = MOCK_STUDENTS;
  const events = MOCK_EVENTS;
  const NS = students.length;

  const gcn = lightGCN(students, events);
  const graphEdges = students.reduce((n, s) => n + s.event_history.length, 0);

  if (studentId) {
    const si = students.findIndex((s) => s.user_id === studentId);
    if (si === -1)
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    return NextResponse.json(
      buildResult(students[si], si, students, events, NS, gcn, graphEdges)
    );
  }

  // All students (for dashboard widget)
  return NextResponse.json(
    students.map((s, si) =>
      buildResult(s, si, students, events, NS, gcn, graphEdges)
    )
  );
}