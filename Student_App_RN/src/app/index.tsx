import { Redirect } from "expo-router";

// The Feed is the home screen and is browsable without login (AGENT_STUDENT_APP §Auth).
export default function Index() {
  return <Redirect href="/(tabs)/feed" />;
}
