import React, { useState } from "react";
import EntryScreen from "./screens/EntryScreen";
import JovenLoginScreen from "./screens/JovenLoginScreen";
import OnboardingScreen from "./screens/OnboardingScreen";
import HomeJoven from "./screens/HomeJoven";
import ConversationScreen from "./screens/ConversationScreen";
import ContextCheckScreen from "./screens/ContextCheckScreen";
import SignalsScreen from "./screens/SignalsScreen";
import SituationMapScreen from "./screens/SituationMapScreen";
import AttentionLevelScreen from "./screens/AttentionLevelScreen";
import RouteScreen from "./screens/RouteScreen";
import PersonalReportScreen from "./screens/PersonalReportScreen";
import JourneyScreen from "./screens/JourneyScreen";
import HelpSomeoneScreen from "./screens/HelpSomeoneScreen";
import ReferralScreen from "./screens/ReferralScreen";
import ProLoginScreen from "./screens/ProLoginScreen";
import ProWorkspaceScreen from "./screens/ProWorkspaceScreen";
import ProAlertsScreen from "./screens/ProAlertsScreen";
import ProCaseScreen from "./screens/ProCaseScreen";
import ProTimelineScreen from "./screens/ProTimelineScreen";
import ProCaseFichaScreen from "./screens/ProCaseFichaScreen";
import ProVisualizationsScreen from "./screens/ProVisualizationsScreen";
import ObservatoryScreen from "./screens/ObservatoryScreen";
import MoodboardScreen from "./screens/MoodboardScreen";

export type Screen =
  | "entry"
  | "moodboard"
  | "joven-login"
  | "onboarding"
  | "home-joven"
  | "conversation"
  | "context-check"
  | "signals"
  | "situation-map"
  | "attention-level"
  | "route"
  | "personal-report"
  | "journey"
  | "help-someone"
  | "referral"
  | "pro-login"
  | "pro-workspace"
  | "pro-alerts"
  | "pro-case"
  | "pro-timeline"
  | "pro-ficha"
  | "pro-viz"
  | "observatory";

export default function App() {
  const [screen, setScreen] = useState<Screen>("entry");
  const nav = (s: Screen) => setScreen(s);

  const screens: Record<Screen, React.ReactElement> = {
    entry: <EntryScreen nav={nav} />,
    moodboard: <MoodboardScreen nav={nav} />,
    "joven-login": <JovenLoginScreen nav={nav} />,
    onboarding: <OnboardingScreen nav={nav} />,
    "home-joven": <HomeJoven nav={nav} />,
    conversation: <ConversationScreen nav={nav} />,
    "context-check": <ContextCheckScreen nav={nav} />,
    signals: <SignalsScreen nav={nav} />,
    "situation-map": <SituationMapScreen nav={nav} />,
    "attention-level": <AttentionLevelScreen nav={nav} />,
    route: <RouteScreen nav={nav} />,
    "personal-report": <PersonalReportScreen nav={nav} />,
    journey: <JourneyScreen nav={nav} />,
    "help-someone": <HelpSomeoneScreen nav={nav} />,
    referral: <ReferralScreen nav={nav} />,
    "pro-login": <ProLoginScreen nav={nav} />,
    "pro-workspace": <ProWorkspaceScreen nav={nav} />,
    "pro-alerts": <ProAlertsScreen nav={nav} />,
    "pro-case": <ProCaseScreen nav={nav} />,
    "pro-timeline": <ProTimelineScreen nav={nav} />,
    "pro-ficha": <ProCaseFichaScreen nav={nav} />,
    "pro-viz": <ProVisualizationsScreen nav={nav} />,
    observatory: <ObservatoryScreen nav={nav} />,
  };

  return <div className="min-h-screen">{screens[screen]}</div>;
}
