import { RuntimeProvider } from "./components/RuntimeProvider";
import { Thread } from "./components/Thread";
import "./App.css";

function App() {
  return (
    <RuntimeProvider>
      <div className="app-shell">
        <header className="app-header">
          <span className="app-header__mark">AI Assistant</span>
          <span className="app-header__status">Local stub · no backend</span>
        </header>
        <main className="app-main">
          <Thread />
        </main>
      </div>
    </RuntimeProvider>
  );
}

export default App;
