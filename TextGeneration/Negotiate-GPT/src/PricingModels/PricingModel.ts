
class InvalidJSONForPricingModel extends Error {

  json: any;
  invalidField: string;

  constructor(json: any, invalidField: string) {
    super("Failed to initialize pricing model with JSON: " + JSON.stringify(json)+"\nInvalid field: "+invalidField+"\n")
    
    this.json = json;
    this.invalidField = invalidField;

  }
}


interface PricingModel {

  //clear for new conversation
  init: () => void;

  //accept deal of price
  accept: (price: number) => boolean;

  //generate offer
  getNewOffer: (...args:any[]) => number;

  //get current parameter value
  getParameter: (parameter: string) => any|undefined;

  //set current parameter value
  setParameter: (parameter: string, value: any) => void;
  
  //get list of all parameters
  listParameters: () => string[];

}



export default PricingModel

export { PricingModel, InvalidJSONForPricingModel}