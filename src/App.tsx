import { RuntimeProvider, useRuntimeExtras } from "./components/RuntimeProvider";
import { ConversationList } from "./components/ConversationList";
import { Thread } from "./components/Thread";
import "./App.css";

function AppShell() {
  const { mode } = useRuntimeExtras();
  return (
    <div className="app-shell">
      <header className="app-header">
        <span className="app-header__mark">AI Assistant</span>
        <span className="app-header__status">
          {mode === "mock" ? "Mock backend · isolated" : "HTTP backend · integrated"}
        </span>
      </header>
      <main className="app-main">
        <ConversationList />
        <Thread />
      </main>
    </div>
  );
}

function App() {
  return (
    <RuntimeProvider>
      <AppShell />
    </RuntimeProvider>
  );
}

export default App;
