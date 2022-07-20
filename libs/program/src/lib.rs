pub fn program() -> String {
    "program".into()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn it_works() {
        assert_eq!(program(), "program".to_string());
    }
}
