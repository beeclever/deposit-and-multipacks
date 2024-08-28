import fs from "fs"
import path from "path"

const TOML_EXTENSION = ".toml"
const PRE_TOML_EXTENSION = ".pre.toml"

export function preprocessFile(file){
  if(!file.endsWith(PRE_TOML_EXTENSION)){
    throw new Error("Unsupported file type.")
  }
  const input = fs.readFileSync(file).toString()
  const regex = /\{\{([^}]*)\}\}/g
  const matches = input.matchAll(regex)
  let output = input;
  for(const match of matches){
    const valueToReplace = match[0]
    const variableName = match[1].trim()
    const envValue = process.env[variableName] || ""
    output = output.replace(valueToReplace, envValue)
  }
  fs.writeFileSync(file.replace(PRE_TOML_EXTENSION, TOML_EXTENSION), output)
}


export function preprocessDir(dir){
  const elements = fs.readdirSync(dir)
  for(const element of elements){
    const elementPath = path.join(dir, element) 
    const stats = fs.statSync(elementPath)
    if(stats.isDirectory()){
      preprocessDir(elementPath)
    }
    if(stats.isFile() && elementPath.endsWith(PRE_TOML_EXTENSION)){
      preprocessFile(elementPath)
    }
  }
}

export function preprocess(fileOrDir){
  const stats = fs.statSync(fileOrDir)
  if(stats.isDirectory()){
    preprocessDir(fileOrDir)
  }
  if(stats.isFile()){
    preprocessFile(fileOrDir)
  }
}