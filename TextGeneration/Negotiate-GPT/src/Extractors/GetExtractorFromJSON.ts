import Extractor, { InvalidJSONForExtractor } from "./Extractor";
import GetFirstNumber from "./GetFirstNumber";

const ExtractorKeys: Map<string, (JSON: any, callAPI: CallAPIFunction) => Extractor<any>> = new Map<string, (JSON: any, callAPI: CallAPIFunction) => Extractor<any>>()


ExtractorKeys.set("GetFirstNumber", (JSON: any, callAPI: CallAPIFunction) => new GetFirstNumber())

export default (JSON: any, callAPI: CallAPIFunction):Extractor<any> => {
  if (JSON.type === undefined|| !ExtractorKeys.has(JSON.type)) {
    throw new InvalidJSONForExtractor(JSON, "type");
  }
  return ExtractorKeys.get(JSON.type)!(JSON, callAPI);
}