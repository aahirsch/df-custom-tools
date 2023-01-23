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
The buyer wants to know more about the painting. 
'$a' denotes a good price for the buyer. The buyer should accept any offer of $a.
'$b' denotes a bad price for the buyer. The buyer should reject any offer of $b.
`;

const frustrationAddition = `The buyer has become frustrated with the seller's responses and is eager to reach a deal quickly.`
const rudeAddition = `The buyer has become rude to the seller and will insult them.`

const opener = aiPartyName + ":";

queryModel = async (preamble, history, opener) => {

  prompt = preamble + "\n" + history + "\n" + opener;

  const response = await openai.createCompletion({
    model: "text-davinci-003",
    prompt: prompt,
    temperature: 0.9,
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

async function getUserInput() {
  return new Promise((resolve) => {
    rl.question(humanPartyName + ": ", (answer) => {
      resolve(answer);
    });
  });
}

conversationLoop = async () => {
  let userMessage = "";
  let conversationHistory = "";
  let frustratedBuyer = false;
  let rude = false;
  while (userMessage != "exit") {
    userMessage = await getUserInput();

    if (userMessage == "FRU") {
      frustratedBuyer = true;
      continue;
    }
    else if (userMessage == "RUD") {
      rude = true;
      continue;
    }

    conversationHistory = conversationHistory + "\n" + humanPartyName + ": " + userMessage;
    let usedPreamble = preamble;
    if (frustratedBuyer) {
      usedPreamble = usedPreamble + "\n" + frustrationAddition;
    }
    if (rude) {
      usedPreamble = usedPreamble + "\n" + rudeAddition;
    }

    aiMessage = await queryModel(usedPreamble, conversationHistory, opener);
    console.log(aiPartyName + ": " + aiMessage);
    conversationHistory = conversationHistory + "\n" + aiPartyName + ": " + aiMessage;
  }
  return

}
conversationLoop();