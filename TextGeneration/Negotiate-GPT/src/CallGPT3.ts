const {Configuration, OpenAIApi} = require("openai")

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
  organization: "org-FCpiZTYOz0vPNKpwx9lIF6YU"
})

const openai = new OpenAIApi(configuration)

export default (prompt:string,temperature:number, maxTokens: number, stop:Array<string>):Promise<string> => {

  return new Promise<string>(async (resolve,reject) => {

    //#FF0000 TEMPORARY LINE
    await setTimeout(() => {}, 100)

    const response = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: prompt,
      max_tokens: maxTokens,
      temperature:temperature,
      top_p:1,
      frequency_penalty:0.0,
      presence_penalty:0.6,
      stop: stop
    })
    resolve(response.data.choices[0].text)
  })
}