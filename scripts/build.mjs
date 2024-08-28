import { execSync } from 'child_process';
import fs from "fs"

  
function updateBuldStatus(status){
  fs.writeFileSync('public/status.json', JSON.stringify(status))
}

function restartPlesk(){
  console.log("Restarting app...")
  if(!fs.existsSync('tmp/')){
    fs.mkdirSync('tmp')
  }
  execSync('touch tmp/restart.txt',{ stdio: [process.stdin, process.stdout, process.stderr]});
}

function build(){
  console.log("Building app...")
  execSync('npm run build:remix',{ stdio: [process.stdin, process.stdout, process.stderr]});
}

function installDependencies(){
  console.log("Updating dependecies...")
  execSync('npm i',{ stdio: [process.stdin, process.stdout, process.stderr]});
}

try {

  updateBuldStatus({
    status: "Installing dependencies",
    lastUpdated: new Date().toISOString()
  })
  
  installDependencies()

  updateBuldStatus({
    status: "Building",
    lastUpdated: new Date().toISOString()
  })

  build()

  updateBuldStatus({
    status: "Restarting",
    lastUpdated: new Date().toISOString()
  })

  
  restartPlesk()

  updateBuldStatus({
    status: "Running",
    lastUpdated: new Date().toISOString()
  })


} catch (error) {
  console.error(error)

  updateBuldStatus({
    status: "Error",
    message: String(error),
    lastUpdated: new Date().toISOString()
  })

}




