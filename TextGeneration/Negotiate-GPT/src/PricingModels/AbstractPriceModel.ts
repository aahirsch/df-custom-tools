import PricingModel, { InvalidJSONForPricingModel } from "./PricingModel";

abstract class AbstractPriceModel implements PricingModel{

  protected activeParameters = new Map<string, any>();
  protected parametersList = new Array<string>();
  
  private defaultParameters = new Map<string, any>();

  constructor(defaultParameters: Map<string, any>) {
    for(var key in defaultParameters.keys()){
      this.parametersList.push(key);
      this.defaultParameters.set(key, defaultParameters.get(key));
    } 
    this.init()
  }

  public abstract accept(price: number): boolean;

  public abstract getNewOffer(...args:any[]): number;

  public init() {
    this.parametersList.forEach(parameter => {
      this.activeParameters.set(parameter, this.defaultParameters.get(parameter));
    });
  }

  public getParameter(parameter: string):any {
    return this.activeParameters.get(parameter);
  }

  public setParameter(parameter: string, value: any) {
    if(this.parametersList.indexOf(parameter) != -1){
      this.activeParameters.set(parameter, value);
    }
  }

  public listParameters() {
    //return copy of parameters list
    return this.parametersList.slice();
  }

  protected loadParametersFromJSON(json: any) {
    if(json.parameters==undefined){
      throw new Error("Invalid JSON for pricing model: missing parameters field");
    }

    const defaultParametersMap: Map<string, any> = new Map<string, any>();
    const parametersNames: Array<string> = new Array<string>();

    json.parameters.forEach((parameter: { name: string | undefined; value: undefined; }) => {
      if(parameter.name==undefined){
        throw new InvalidJSONForPricingModel(json, "name");
      }
      if(parameter.value==undefined){
        throw new InvalidJSONForPricingModel(json, "value");
      }
      parametersNames.push(parameter.name);
      defaultParametersMap.set(parameter.name, parameter.value);
    });

    this.defaultParameters = defaultParametersMap;
    this.parametersList = parametersNames;

    this.activeParameters = new Map<string, any>();
    this.init();
  }

}

export default AbstractPriceModel