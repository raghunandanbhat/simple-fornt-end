use evalexpr::eval;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn eval_expression(expr: &str) -> String {
    let trimmed_expr = expr.trim();

    if trimmed_expr.is_empty() {
        return "Error: Empty expression".to_string();
    }

    match eval(trimmed_expr) {
        Ok(result) => result.to_string(),
        Err(_) => "Error: Invalid expression".to_string(),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn valid_add_expr() {
        let res = eval_expression("2+3+5");
        assert_eq!(res, "10");
    }

    #[test]
    fn valid_sub_expr() {
        let res = eval_expression("5-4");
        assert_eq!(res, "1");
    }

    #[test]
    fn valid_mul_expr() {
        let res = eval_expression("5*4");
        assert_eq!(res, "20");
    }

    #[test]
    fn valid_div_expr() {
        let res = eval_expression("20/4");
        assert_eq!(res, "5");
    }

    #[test]
    fn valid_paranth_expr() {
        let res = eval_expression("(5 + (4 * 5 )) / 5");
        assert_eq!(res, "5");
    }

    #[test]
    fn valid_float() {
        let res = eval_expression("2.5 + 2.6");
        assert_eq!(res, "5.1");
    }

    #[test]
    fn invalid_char_expr() {
        let res = eval_expression("1+a");
        assert_eq!(res, "Error: Invalid expression")
    }

    #[test]
    fn invalid_whitespace() {
        let res = eval_expression("       ");
        assert_eq!(res, "Error: Empty expression")
    }

    #[test]
    fn invalid_float() {
        let res = eval_expression("2.3.4 + 1.5");
        assert_eq!(res, "Error: Invalid expression");
    }

    #[test]
    fn invalid_positive_inf() {
        let res = eval_expression("2/0");
        // assert_eq!(res, "inf");
        assert_eq!(res, "Error: Invalid expression");
    }

    #[test]
    fn invalid_negative_inf() {
        let res = eval_expression("-2/0");
        // assert_eq!(res, "-inf");
        assert_eq!(res, "Error: Invalid expression");
    }

    #[test]
    fn invalid_symbol() {
        let res = eval_expression("1 ? 2");
        assert_eq!(res, "Error: Invalid expression");
    }

    #[test]
    fn single_digit() {
        let res = eval_expression("3");
        assert_eq!(res, "3");
    }

    #[test]
    fn invalid_single_digit() {
        let res = eval_expression("3.2.3");
        assert_eq!(res, "Error: Invalid expression");
    }

    #[test]
    fn missing_oprand() {
        let res = eval_expression("2 + ");
        assert_eq!(res, "Error: Invalid expression");
    }

    #[test]
    fn missing_oprands() {
        let res = eval_expression("+");
        assert_eq!(res, "Error: Invalid expression");
    }

    // probably a bug in meval-rs, evalexpr too
    #[test]
    fn weird_test1() {
        let res = eval_expression("2 --- 1");
        assert_eq!(res, "1");
    }

    // yet another bug!?
    #[test]
    fn weird_test2() {
        let res = eval_expression("2 -- 1");
        assert_eq!(res, "3");
    }

    #[test]
    fn another_weird_test() {
        let res = eval_expression("2 -*- 1"); // this doesn't evaluate
        assert_eq!(res, "Error: Invalid expression");
    }
}
