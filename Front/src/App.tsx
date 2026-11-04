import { useState } from "react";
import Times from "./pages/Times";
import TimeDetalhes from "./pages/TimeDetalhes";
import type { Time } from "./types";

function App() {
  const [timeSelecionado, setTimeSelecionado] = useState<Time | null>(null);

  if (timeSelecionado) {
    return (
      <TimeDetalhes
        time={timeSelecionado}
        onVoltar={() => setTimeSelecionado(null)}
      />
    );
  }

  return <Times onSelecionarTime={setTimeSelecionado} />;
}

export default App;
