use crate::state::{Class, Rarity};

pub fn get_uri<'life>(class: Class, rarity: Option<Rarity>) -> &'life str {
    match class {
        Class::Ruby => match rarity {
            Some(rarity_type) => match rarity_type {
                Rarity::Common => "RubyCommon",
                Rarity::Uncommon => "RubyUncommon",
                Rarity::Rare => "RubyRare",
                Rarity::Exalted => "RubyExalted",
                Rarity::Mythic => "https://arweave.net/V-GN01-V0OznWUpKEIf0XAMEA_-ndFOfYKNJoPdNpsE",
            },
            None => "https://arweave.net/269uSJ8LWFFeWVA44oeJuvAJhD6Otu6_9Ruc323zKi0",
        },
        Class::Diamond => match rarity {
            Some(rarity_type) => match rarity_type {
                Rarity::Common => "DiamondCommon",
                Rarity::Uncommon => "DiamondUncommon",
                Rarity::Rare => "DiamondRare",
                Rarity::Exalted => "DiamondExalted",
                Rarity::Mythic => "https://arweave.net/K8A0TAPGY0QZCuyPDXPemGNNtKe97r07JCQ5pS4J6nA",
            },
            None => "https://arweave.net/mxqPr11o3xJrV0lSxPpjSjry8YBf2nRGFsPMkiFIL4g",
        },
        Class::Sapphire => match rarity {
            Some(rarity_type) => match rarity_type {
                Rarity::Common => "SapphireCommon",
                Rarity::Uncommon => "SapphireUncommon",
                Rarity::Rare => "SapphireRare",
                Rarity::Exalted => "SapphireExalted",
                Rarity::Mythic => "https://arweave.net/00h-GOmxAzRuo3FAyddmd0VVazj6fNId3Xkhg5S3Fww",
            },
            None => "https://arweave.net/4ddiMaqN-1LxQuGfcJE3qUbKh-IaULpTK9BYYlbY17s",
        },
        Class::Emerald => match rarity {
            Some(rarity_type) => match rarity_type {
                Rarity::Common => "EmeraldCommon",
                Rarity::Uncommon => "EmeraldUncommon",
                Rarity::Rare => "EmeraldRare",
                Rarity::Exalted => "EmeraldExalted",
                Rarity::Mythic => "https://arweave.net/RXG9EgRsMVrpGpAd5PgjzCfP0hBdybMepf07wQPoXEU",
            },
            None => "https://arweave.net/DdZ9tKy1ZBfTKHFXsPzhkcBMYTSsv5g7bmgZ_d6mG1Y",
        },
        Class::Serendibite => match rarity {
            Some(rarity_type) => match rarity_type {
                Rarity::Common => "SerendibiteCommon",
                Rarity::Uncommon => "SerendibiteUncommon",
                Rarity::Rare => "SerendibiteRare",
                Rarity::Exalted => "SerendibiteExalted",
                Rarity::Mythic => "https://arweave.net/kng_bDJLMewvQ_1_M2YUrRnGJjoH-YWf-eRYeCXj7cE",
            },
            None => "https://arweave.net/e3ao7wBo7wSp5EHUNNg79MN8seQTZ5HNCSLQdxTPmlg",
        },
        Class::Benitoite => match rarity {
            Some(rarity_type) => match rarity_type {
                Rarity::Common => "https://arweave.net/jRwtQXRNLRvAdvrauKpIr5scKrVgagiAIxJmC7qwfpo",
                Rarity::Uncommon => {
                    "https://arweave.net/En6u1uvuUKMb7O1PsQ1uVBHsKshfYToKnV2kzBxx3Nw"
                }
                Rarity::Rare => "https://arweave.net/fam42-BK6-2nHDae8pmMjNfadAkfkho42wCMoSBz0qk",
                Rarity::Exalted => {
                    "https://arweave.net/CpOk7NBU-vVD7s7N22YXoy0ffAHc-Nwj8FfLIViloiM"
                }
                Rarity::Mythic => "https://arweave.net/kvqeN_tHeVprbecix2aO4mBrdHAT8k4szgQxDnu14UQ",
            },
            None => "https://arweave.net/Xo-Hk-ZHswayP5kJeiajj1WUCnBnTWH_1_FXxP2tQlw",
        },
    }
}

impl Class {
    pub fn get_rarity(self, random_value: u64) -> Option<Rarity> {
        Some(match self {
            Class::Benitoite => match random_value {
                2000..=u64::MAX => Rarity::Common,
                610..=1999 => Rarity::Uncommon,
                110..=609 => Rarity::Rare,
                10..=109 => Rarity::Exalted,
                0..=9 => Rarity::Mythic,
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
