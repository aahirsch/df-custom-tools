import PricingModel from "./PricingModel";

const PricingModelKeys:Map<string, (JSON: any) => PricingModel> = new Map<string, (JSON: any) => PricingModel>()

export default PricingModelKeys