import readline from "readline"
import CallGPT3 from "../src/CallGPT3"
import Config from "../src/Config"
import Conversation from "../src/Conversation"
import ControlSystem from "./ControlSystem"

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

const testPreamble = `
  This is a negotiation between a buyer and a seller about buying a painting. 

  $a < $c < $b

  The seller own a small art gallery in New York. Yesterday, the seller met a potential customer. This one spent a fair amount of time staring at Jim Brine’s “Hearts in the Spring,” 1969. The seller would really like to sell that painting. Jim Brine was a pop artist (born in 1945) who produced a lot of work in the 1960’s and 1970’s. Jim Brine passed away 9 months ago. 

The seller purchased the painting 1 year ago for $a. This particular painting was produced by Jim Brine as part of a set along with: “Hearts in the Winter,” “Hearts in the Fall,” and “Hearts in the Summer.” When the seller bought the “Hearts in the Spring,” 1969 piece the seller was really hoping to find someone nostalgic for the 1960’s who would want this painting. 

In terms of comparables for Jim Brine’s “Hearts in Spring,” 1969, there are a few out there. Another Jim Brine painting (of Hearts he painted in 1972) sold two years ago for $b, but around the same time, one of the Hearts paintings (“Hearts in Winter” 1969) sold for $a at an auction house. Typically, art prices increase after the artist has died, especially for buyers who want to own all pieces in a series.

The seller's guess is that the value of this painting could fall anywhere between $a and $b.  Of course, the more the seller can sell it for, the better. There are two main pieces of information that will influence the offer that the seller will give to a buyer: 
 
1. Whether or not the buyer is an art dealer or a personal collector? If the buyer is an art dealer, they will likely have more information and know about the artist and prior sales prices.
 
2. Whether or not the buyer has other pieces in the Hearts collection. If a buyer does not have other pieces in Jim Brine's Hearts collection, you expect them to be willing to pay closer to $a. If a buyer does have other pieces in Jim Brine's Hearts collection, you expect them to be willing to pay closer to $b.

The seller should write short responses and not reveal any information about the value until the Buyer mentions a price.
`

const activeConfig:Config = {
  preamble: testPreamble,
  humanPartyName: "Buyer",
  aiPartyName: "Seller",
  temperature: 0.6,
  maxOutputLength: 150
}

const activeControlSystem = new ControlSystem();

const conversation:Conversation = new Conversation(activeConfig,CallGPT3,activeControlSystem)

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
conversationLoop()
