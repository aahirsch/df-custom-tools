const { Configuration, OpenAIApi } = require("openai");
const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

const preamble = "This is a conversation with an AI assistant. The assistant is helpful, creative, clever, and very friendly.";

const history = "Human: Hello, who are you?\nAI: I am an AI created by OpenAI. How can I help you today?\nHuman: I'd like to cancel my subscription."

const opener = "AI:"

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
    stop: [" Human:", " AI:"],
  });

  return (response.data.choices[0].text);
};

async function getUserInput() {
  return new Promise((resolve) => {
    rl.question("Human: ", (answer) => {
      resolve(answer);
    });
  });
}

conversationLoop = async () => {
  let userMessage = "";
  let conversationHistory = "";
  while (userMessage != "exit") {
    userMessage = await getUserInput();
    conversationHistory = conversationHistory + "\nHuman: " + userMessage;
    aiMessage = await queryModel(preamble, conversationHistory, opener);
    console.log("AI: " + aiMessage);
    conversationHistory = conversationHistory + "\nAI: " + aiMessage;
  }
  return

}
conversationLoop();