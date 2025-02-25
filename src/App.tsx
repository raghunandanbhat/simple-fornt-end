import React, { useState } from "react";
import "./App.css";
import Calculator from "./Calculator";

function App() {
  const [tab, setTab] = useState("calculator");

  return (
    <div className="App">
      <nav>
        <button onClick={() => setTab("calculator")}>Calculator</button>
        {/* <button></button> */}
        {tab === "calculator" && <Calculator />}
      </nav>
    </div>
  );
}

export default App;
