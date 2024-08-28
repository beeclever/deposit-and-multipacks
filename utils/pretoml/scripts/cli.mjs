#!/usr/bin/env node
import { preprocess } from "../lib/pretoml.mjs";

const command = process.argv[2]

if(!command){
  console.log("Welcome to pretoml")
  console.log("Use 'pretoml process <file or folder>' to process .pre.toml files into .toml files.")
}

if(command == "process"){
  const path = process.argv[3]
  if(!path){
    console.error("No path was provided.")
  }
  preprocess(path)
}

