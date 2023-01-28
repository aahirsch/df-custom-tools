import readline from "readline"
import fs from "fs"
import CallGPT3 from "../src/CallGPT3"
import Conversation from "../src/Conversation"

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

import * as path from "path"

const activeConfig= require(path.resolve()+"/testConfigs/HeartsChatToiletBoom.json")

const s = activeConfig.preamble.split(" ")
if (s[0]=="FILE"){
  activeConfig.preamble = fs.readFileSync("testConfigs/"+s[1]+".txt").toString()
}

const conversation:Conversation = new Conversation(activeConfig,CallGPT3)

const getUserInput = async (prompt:string) => {
  return new Promise<string>((resolve) => {
    rl.question(prompt, (response) => {
      resolve(response)
    })
  })
}

const conversationLoop = async () => {
  while(true){
    const humanMessage = await getUserInput(activeConfig.humanPartyName + ": ")
    const botResponse = await conversation.sendMessage(humanMessage)
    console.log(activeConfig.aiPartyName + ": " + botResponse)
  }
}

console.log(activeConfig.preamble)
console.log("\n")
conversationLoop()
