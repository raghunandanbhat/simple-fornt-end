import React, { useState } from "react";
import "./App.css";
import Calculator from "./Calculator";
import ShaderDisplay from "./Canvas";

function App() {
  const [tab, setTab] = useState("calculator");

  return (
    <div className="App">
      <nav>
        <button onClick={() => setTab("calculator")}>Calculator</button>
        <button onClick={() => setTab("canvas")}>WebGL Canvas</button>
        {tab === "calculator" && <Calculator />}
        {tab === "canvas" && <ShaderDisplay />}
      </nav>
    </div>
  );
}

export default App;
