use crate::state::{Class, Rarity};

pub fn get_uri<'life>(class: Class, rarity: Option<Rarity>) -> &'life str {
    match class {
        Class::Ruby => match rarity {
            Some(rarity_type) => match rarity_type {
                Rarity::Common => "https://arweave.net/8kXpslAhB2gHYd0wg31336X4dFGKt8xLrn_cElh5fkc",
                Rarity::Uncommon => "https://arweave.net/bJk5hH6wSAC1maI-lxafSGccOk5HjfAPoUI2WIJiTkA",
                Rarity::Rare => "https://arweave.net/P-lBqcffiwjGETt6xjgR67JkxBTaYdHElxL7wh23_xk",
                Rarity::Exalted => "https://arweave.net/t0QSJrBkDViMZ1l2UBD-zxSCvdUFpkygSOwLChDW6S4",
                Rarity::Mythic => "https://arweave.net/thnK3i2c3CXGLNv2dp41Qohj8tPPSBmRDqY2kNd6SzY",
            },
            None => "https://arweave.net/CHqG0ntgg2GeSCNmZnFGGrLsQExwnnaOuUg5S4GpmpI",
        },
        Class::Diamond => match rarity {
            Some(rarity_type) => match rarity_type {
                Rarity::Common => "https://arweave.net/TyZgMdpiVVOgeR7pBMbdxBoyhYMk7sTZNUcXwvx1wHg",
                Rarity::Uncommon => "https://arweave.net/rzEYBGB_qnQF3jYZOBNkgmSJj4__OyzKyN9uSYa4jjo",
                Rarity::Rare => "https://arweave.net/bzCaE6nqhdiC5Jjy6kY7W6kNmuDYjf_Hm-42BrK4orM",
                Rarity::Exalted => "https://arweave.net/AjNtC0wQQOoAJfnZ9ztddD-H2g12YvlgiDm560zgsVA",
                Rarity::Mythic => "https://arweave.net/pF61d-hw1dO5gePxho8GuiZTvZzdUe26WqEclEKPMdY",
            },
            None => "https://arweave.net/lYILyALpyS8QXb0GF-HkGZEgJhv8Z89JPHO5CDzxxTc",
        },
        Class::Sapphire => match rarity {
            Some(rarity_type) => match rarity_type {
                Rarity::Common => "https://arweave.net/HNiKSWc-TpoVPvrH-JvOXDNdonvIkA-2bnQ_12k_eTM",
                Rarity::Uncommon => "https://arweave.net/Iq0okiWhRU8six9FyzuXQeD0rQTjMVqO7TZrB82qM-g",
                Rarity::Rare => "https://arweave.net/KVGyp00fmt3nunXqQlHNqHKmUdqJ9awI8BUbjCQrRnU",
                Rarity::Exalted => "https://arweave.net/02-BFFMcxhekHdD7j47SmrxIn9G51RYOmNp9fcWdeiM",
                Rarity::Mythic => "https://arweave.net/zd0ukdJg10LFPXQB1vcC2FcjKDB84vw4pHmkPgph_jQ",
            },
            None => "https://arweave.net/zJoSGOkI09gUKZ7FFvsrYsx8oLZ1Bmt0A_YMLw4AwTE",
        },
        Class::Emerald => match rarity {
            Some(rarity_type) => match rarity_type {
                Rarity::Common => "https://arweave.net/J3pvuY3pXFwcFAaqwDRimm-sF3QfnJ0GOOCATjzT6is",
                Rarity::Uncommon => "https://arweave.net/Qq0hyEM11J93Am_PKbtNmvT4j5eBolri91mkTn7eCXQ",
                Rarity::Rare => "https://arweave.net/DsQ2isTGvNnTRLuh4CUvLzA4tCoEVtsM0FDnycsQzME",
                Rarity::Exalted => "https://arweave.net/FDP8E_oDoaf-k1gRXNFY_Fv7EkuaAy4VEIMbUNTR19s",
                Rarity::Mythic => "https://arweave.net/sjpT7pZFGaVGB_TcHhKbWX8ZJJAHE1suXpgVOqx0cfU",
            },
            None => "https://arweave.net/aAjZuvv9LUiqOcodbRNnlt-Ln9wgcsFPcuOF9BZXBxU",
        },
        Class::Serendibite => match rarity {
            Some(rarity_type) => match rarity_type {
                Rarity::Common => "https://arweave.net/Z5YgxSVj4TdSijJcU2FHo55P8SZTbogRCx6YA07xBq0",
                Rarity::Uncommon => "https://arweave.net/q4m1nQZs0WCzEXICiRxZB8OsXlwaQaNq6ZO9rnafhs4",
                Rarity::Rare => "https://arweave.net/HKO2zwzA78V2tJvteyf4kCc-mG8Qt-q7sH9lS_NNz6E",
                Rarity::Exalted => "https://arweave.net/P-6Xv_KuTkusbUQ1xL38ROagslDLmBron1OVU114sKo",
                Rarity::Mythic => "https://arweave.net/ibm7p1hkaBXtFM5WGK2uZ8hXtgBJucXA9iObBweMWZI",
            },
            None => "https://arweave.net/jNf8mPzhfwsQM1HQ6xSDLROt0uf7fRMz7_3N5zJOFSk",
        },
        Class::Benitoite => match rarity {
            Some(rarity_type) => match rarity_type {
                Rarity::Common => "https://arweave.net/VXmsbPgGyiumbiiQClrGXC8Sp2ezrwRP-sKq5yv71b0",
                Rarity::Uncommon => {
                    "https://arweave.net/L13aXTG3DgPjb5r4-cCKRaKEgprLRv5sqtkxktRZjYg"
                }
                Rarity::Rare => "https://arweave.net/4Xf3L2acjFsykdlXewAZkn4nQS7xq6kLAgFxDMSIBzg",
                Rarity::Exalted => {
                    "https://arweave.net/7a8tB2RrKj7blya4s9H-8SXarbY5x-5xdarSq05jyfA"
                }
                Rarity::Mythic => "https://arweave.net/Z6ScSn8y5ZJ2U9tzzCkEVUQFcTSIZN83pczJY0Kws-k",
            },
            None => "https://arweave.net/i-0Sj0OhvFw6003cR0PA0PAmQHXy3kww1E_kaL_EtmY",
        },
    }
}



impl Class {
    pub fn get_rarity(self, random_value: u64) -> Option<Rarity> {
        Some(match self {
            Class::Benitoite => match random_value { // Rebalance this Later. Changed to create equal chances for testing purposes.
                8000..=u64::MAX => Rarity::Common,
                6000..=7999 => Rarity::Uncommon,
                4000..=5999 => Rarity::Rare,
                2000..=3999 => Rarity::Exalted,
                0..=1999 => Rarity::Mythic,
            },
            Class::Serendibite => match random_value {
                3880..=u64::MAX => Rarity::Common,
                880..=3879 => Rarity::Uncommon,
                180..=879 => Rarity::Rare,
                30..=179 => Rarity::Exalted,
                0..=29 => Rarity::Mythic,
            },
            Class::Emerald => match random_value {
                5000..=u64::MAX => Rarity::Common,
                1070..=4999 => Rarity::Uncommon,
                270..=1069 => Rarity::Rare,
                70..=269 => Rarity::Exalted,
                0..=69 => Rarity::Mythic,
            },
            Class::Sapphire => match random_value {
                8000..=u64::MAX => Rarity::Common,
                2000..=7999 => Rarity::Uncommon,
                650..=1999 => Rarity::Rare,
                150..=649 => Rarity::Exalted,
                0..=149 => Rarity::Mythic,
            },
            Class::Diamond => match random_value {
                8500..=u64::MAX => Rarity::Common,
                3000..=8499 => Rarity::Uncommon,
                900..=2999 => Rarity::Rare,
                200..=899 => Rarity::Exalted,
                0..=199 => Rarity::Mythic,
            },
            Class::Ruby => match random_value {
                9000..=u64::MAX => Rarity::Common,
                5000..=8999 => Rarity::Uncommon,
                1500..=4999 => Rarity::Rare,
                500..=1499 => Rarity::Exalted,
                0..=499 => Rarity::Mythic,
            },
        })
    }
}
