import { MOCK_EVENTS as EVENTS, MOCK_STUDENT_ROWS, mockKpis } from "./mocks";

export const MOCK_EVENTS = EVENTS.map((event) => {
  const kpis = mockKpis(event.id);

  return {
    ...event,
    attendee_count: kpis.visitor_count,
    kpis: {
      registered: kpis.registered,
      checked_in: kpis.appeared,
    },
  };
});

export const MOCK_STUDENTS = MOCK_STUDENT_ROWS.map((student) => ({
  ...student,
  study_degree: student.target_group ?? "Student",
  engagement_score:
    student.priority_band === "high" ? 92 : student.priority_band === "medium" ? 68 : 41,
  lead_status: student.follow_up_status,
}));
