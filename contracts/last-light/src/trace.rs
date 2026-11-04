use std::{io::{self,Read},collections::BTreeMap};
use last_light::model::*;
use near_sdk::serde_json::{self,Value};
fn main(){let mut text=String::new();io::stdin().read_to_string(&mut text).unwrap();let input:Value=serde_json::from_str(&text).unwrap();let mut game:Game=if input.get("state").is_some(){serde_json::from_value(input["state"].clone()).unwrap()}else{create("parity")};for value in input["rounds"].as_array().unwrap(){let mut orders:BTreeMap<String,Order>=serde_json::from_value(value.clone()).unwrap();if !orders.contains_key("NPC"){orders.insert("NPC".into(),npc(&game,&orders));}settle(&mut game,orders);if game.status!="playing"{break;}}println!("{}",serde_json::to_string(&game).unwrap());}
