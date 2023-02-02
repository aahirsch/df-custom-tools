import Extractor from "./Extractor";

const ExtractorKeys:Map<string,(JSON: any, callAPI: CallAPIFunction) => Extractor<any>> = new Map<string,(JSON:any, callAPI:CallAPIFunction) => Extractor<any>>()

export default ExtractorKeys