import Config from "./Config"
import ControlSystem from "./ControlSystem"
import PricingModel  from "./PricingModels/PricingModel"
import pricingModelFromJSON from "./PricingModels/PricingModelFromJSON"

/**
 * This class handles the behavior of the chatbot but not specific conversation information.
 * 
 * This class is concerned with holding and providing information relevant to the chatbot operation and with holding the control system.
 * 
 * The idea here is that the control system (and other parts of the config) only has to be set up once to support multiple conversations.
 * 
 * This includes the ControlSystem, the PricingModel, and the Prompt
 */
class Chatbot{

  private config:Config
  private callAPISource:CallAPIFunction
  private controlSystem:ControlSystem

  public pricingModel:PricingModel

  constructor(config:Config, callAPI:CallAPIFunction){
    this.config = config
    this.callAPISource = callAPI
    this.controlSystem = ControlSystem.fromJSON(config.controlSystem)

    this.pricingModel = pricingModelFromJSON(config.pricingModel)
  }

  /**
   * 
   * @returns The unprocessed preamble of the chatbot
   */
  public getRawPreamble():string{
    return this.config.preamble
  }

  public callAPI(prompt:string):Promise<string>{
    return this.callAPISource(
      prompt, this.config.temperature,
      this.config.maxOutputLength,
      [this.config.humanPartyName+":",this.config.aiPartyName+":"]
      )
  }

}

export default Chatbot