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
    <div>
      <h2>Calculator</h2>
      <input
        type="text"
        value={expr}
        onChange={(e) => setExpr(e.target.value)}
        placeholder="Enter expression "
      />
      <button onClick={handleCalculate}>Evaluate</button>
      {result && <p>Result: {result}</p>}
    </div>
  );
}

export default Calculator;
