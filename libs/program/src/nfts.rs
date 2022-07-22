use crate::state::{Rarity, Class};

pub fn get_uri<'life>(class: Class, rarity: Option<Rarity>) -> &'life str{
    match class{
        Class::Ruby => {
            match rarity {
                Some(rarity_type) => {
                    match rarity_type {
                        Rarity::Common => {"RubyCommon"}
                        Rarity::Uncommon => {"RubyUncommon"}
                        Rarity::Rare => {"RubyRare"}
                        Rarity::Exalted => {"RubyExalted"}
                        Rarity::Mythic => {"https://arweave.net/V-GN01-V0OznWUpKEIf0XAMEA_-ndFOfYKNJoPdNpsE"}
                    }
                }
                None => {"https://arweave.net/269uSJ8LWFFeWVA44oeJuvAJhD6Otu6_9Ruc323zKi0"}
            }
        }
        Class::Diamond => {
            match rarity {
                Some(rarity_type) => {
                    match rarity_type {
                        Rarity::Common => {"DiamondCommon"}
                        Rarity::Uncommon => {"DiamondUncommon"}
                        Rarity::Rare => {"DiamondRare"}
                        Rarity::Exalted => {"DiamondExalted"}
                        Rarity::Mythic => {"https://arweave.net/K8A0TAPGY0QZCuyPDXPemGNNtKe97r07JCQ5pS4J6nA"}
                    }
                }
                None => {"https://arweave.net/mxqPr11o3xJrV0lSxPpjSjry8YBf2nRGFsPMkiFIL4g"}
            }
        }
        Class::Sapphire => {
            match rarity {
                Some(rarity_type) => {
                    match rarity_type {
                        Rarity::Common => {"SapphireCommon"}
                        Rarity::Uncommon => {"SapphireUncommon"}
                        Rarity::Rare => {"SapphireRare"}
                        Rarity::Exalted => {"SapphireExalted"}
                        Rarity::Mythic => {"https://arweave.net/00h-GOmxAzRuo3FAyddmd0VVazj6fNId3Xkhg5S3Fww"}
                    }
                }
                None => {"https://arweave.net/4ddiMaqN-1LxQuGfcJE3qUbKh-IaULpTK9BYYlbY17s"}
            }
        }
        Class::Emerald => {
            match rarity {
                Some(rarity_type) => {
                    match rarity_type {
                        Rarity::Common => {"EmeraldCommon"}
                        Rarity::Uncommon => {"EmeraldUncommon"}
                        Rarity::Rare => {"EmeraldRare"}
                        Rarity::Exalted => {"EmeraldExalted"}
                        Rarity::Mythic => {"https://arweave.net/RXG9EgRsMVrpGpAd5PgjzCfP0hBdybMepf07wQPoXEU"}
                    }
                }
                None => {"https://arweave.net/DdZ9tKy1ZBfTKHFXsPzhkcBMYTSsv5g7bmgZ_d6mG1Y"}
            }
        }
        Class::Serendibite => {
            match rarity {
                Some(rarity_type) => {
                    match rarity_type {
                        Rarity::Common => {"SerendibiteCommon"}
                        Rarity::Uncommon => {"SerendibiteUncommon"}
                        Rarity::Rare => {"SerendibiteRare"}
                        Rarity::Exalted => {"SerendibiteExalted"}
                        Rarity::Mythic => {"https://arweave.net/kng_bDJLMewvQ_1_M2YUrRnGJjoH-YWf-eRYeCXj7cE"}
                    }
                }
                None => {"https://arweave.net/e3ao7wBo7wSp5EHUNNg79MN8seQTZ5HNCSLQdxTPmlg"}
            }
        }
        Class::Benitoite => {
            match rarity {
                Some(rarity_type) => {
                    match rarity_type {
                        Rarity::Common => {"BenitoiteCommon"}
                        Rarity::Uncommon => {"BenitoiteUncommon"}
                        Rarity::Rare => {"BenitoiteRare"}
                        Rarity::Exalted => {"BenitoiteExalted"}
                        Rarity::Mythic => {"https://arweave.net/kvqeN_tHeVprbecix2aO4mBrdHAT8k4szgQxDnu14UQ"}
                    }
                }
                None => {"https://arweave.net/Xo-Hk-ZHswayP5kJeiajj1WUCnBnTWH_1_FXxP2tQlw"}
            }
        }
    }
}