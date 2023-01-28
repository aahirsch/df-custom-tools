import readline from "readline"
import CallGPT3 from "../src/CallGPT3"
import { LanguageSpecifiedCondition, CheckOn, NeedToInclude } from "../src/Conditions/LanguageSpecifiedCondition"

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

const getUserInput = async (prompt:string) => {
  return new Promise<string>((resolve) => {
    rl.question(prompt, (response) => {
      resolve(response)
    })
  })
}

const test = async () => {
  const preamble = await getUserInput("Preamble: ")
  const humanPartyName = await getUserInput("Human Party Name: ")
  const aiPartyName = await getUserInput("AI Party Name: ")


  console.log("\nEnd QUTI to end the sample conversation\n")

  var history=""
  
  var lastMessage=""

  var humanTurn = true

  while(lastMessage!="QUIT"){
    if(humanTurn){
      if(lastMessage!=""){
        history+=aiPartyName+": " + lastMessage+"\n"
      }
    }
    else{
      if(lastMessage!=""){
        history+=humanPartyName+": " + lastMessage+"\n"
      }
    }

    lastMessage=await getUserInput((humanTurn?humanPartyName:aiPartyName)+": ")

    humanTurn=!humanTurn
  }

  console.log("\n")

  while(true){

    const languageSpecification = await getUserInput("Language Specification: ")

    console.log("\n")

    const conditionObject = new LanguageSpecifiedCondition(languageSpecification,CheckOn.Both, CallGPT3, NeedToInclude.PreambleAndHistory)

    console.log(await conditionObject.askAPI(preamble+"\n"+history+"\n"+languageSpecification+"\n\n"))

  }    
}

test()