import React, { useState } from "react";
import init, { eval_expression } from "./wasm/pkg/wasm";

function Calculator() {
  const [expr, setExpr] = useState("");
  const [result, setResult] = useState("");

  const handleCalculate = async () => {
    await init();
    const res = eval_expression(expr);
    setResult(res);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "20px",
        padding: "20px",
      }}
    >
      <h1 style={{ fontSize: "24px", marginBottom: "10px" }}>Calculator</h1>

      <div
        style={{
          display: "flex",
          gap: "10px",
          width: "100%",
          maxWidth: "500px",
        }}
      >
        <input
          type="text"
          value={expr}
          onChange={(e) => setExpr(e.target.value)}
          placeholder="Enter expression "
          style={{
            flex: 1,
            padding: "8px",
            border: "1px solid #ccc",
            borderRadius: "4px",
          }}
        />

        <button
          onClick={handleCalculate}
          style={{
            padding: "8px 16px",
            backgroundColor: "#0070f3",
            color: "white",
            border: "none",
            borderRadius: "4px",
          }}
        >
          Evaluate
        </button>
      </div>

      {result && <p>Result: {result}</p>}
    </div>
  );
}

export default Calculator;
