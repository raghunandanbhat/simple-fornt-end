use meval::eval_str;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn eval_expression(expr: &str) -> String {
    match eval_str(expr) {
        Ok(result) => result.to_string(),
        Err(_) => "Error".to_string(),
    }
}

// pub fn eval_expression(expr: &str) -> Result<f64, &'static> {
//     let tokens = tokenize(expr)?;
//     let eval = eval_token(&tokens)?;
//     return
// }
