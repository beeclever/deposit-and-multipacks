
import { preprocessFile, preprocessDir } from "../lib/pretoml.mjs";

preprocessFile(process.cwd()+"/test/test.pre.toml")

preprocessDir(process.cwd()+"/test")