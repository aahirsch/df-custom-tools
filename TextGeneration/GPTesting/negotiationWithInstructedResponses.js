const { Configuration, OpenAIApi } = require("openai");
const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const humanPartyName = "Seller";

const aiPartyName = "Buyer";

const openai = new OpenAIApi(configuration);

const preamble = `This is a conversation between a buyer and a seller about buying a painting. 
The buyer wants to know more about the painting. The buyer should stick closely to their instructions.
The buyer should not make an offer unless instructed to do so.
'$a' denotes a good price for the buyer.
'$b' denotes a bad price for the buyer.
'$c' denotes an acceptable price for the buyer.
`;


const opener = aiPartyName + ":";

queryModel = async (preamble, history, opener) => {

  prompt = preamble + "\n" + history + "\n" + opener;

  const response = await openai.createCompletion({
    model: "text-davinci-003",
    prompt: prompt,
    temperature: 0.4,
    max_tokens: 150,
    top_p: 1,
    frequency_penalty: 0.0,
    presence_penalty: 0.6,
    stop: [humanPartyName + ":", aiPartyName + ":"],
  });

  let aiMessage = response.data.choices[0].text;

  //remove trialing newline
  if (aiMessage[aiMessage.length - 1] == "\n") {
    aiMessage = aiMessage.slice(0, -1);
  }

  return (aiMessage);
};

async function getUserInput(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer);
    });
  });
}

conversationLoop = async () => {
  let userMessage = "";
  let conversationHistory = "";
  while (userMessage != "exit") {
    userMessage = await getUserInput(humanPartyName + ": ");

    responseInstructions = await getUserInput("The buyer should: ");


    conversationHistory = conversationHistory + "\n" + humanPartyName + ": " + userMessage;
    conversationHistory = conversationHistory + "\n(The buyer should " + responseInstructions + " )";

    aiMessage = await queryModel(preamble, conversationHistory, opener);
    console.log(aiPartyName + ": " + aiMessage);
    conversationHistory = conversationHistory + "\n" + aiPartyName + ": " + aiMessage;
  }
  return

}
conversationLoop();