//add all pricing models to this map
import PricingModel, { InvalidJSONForPricingModel } from "./PricingModel";

import PriceBelow from "./PriceBelow"

const PricingModelKeys = new Map<string, (json: any) => PricingModel>();

PricingModelKeys.set("PriceBelow", PriceBelow.fromJSON );

/**
 * Returns the pricing model specified by the JSON
 * 
 * @param JSON - the JSON specification of the pricing model
 * @returns The pricing model specified by the JSON
 * @throws InvalidJSONForPricingModel if the JSON is invalid
 */
const pricingModelFromJSON = (JSON: any): PricingModel => {
  if(JSON.type==undefined){
    throw new InvalidJSONForPricingModel(JSON, "type");
  }
  const pricingModelType = PricingModelKeys.get(JSON.type);
  if(pricingModelType==undefined){
    throw new InvalidJSONForPricingModel(JSON, "type");
  }
  return pricingModelType(JSON)
}

export default pricingModelFromJSON