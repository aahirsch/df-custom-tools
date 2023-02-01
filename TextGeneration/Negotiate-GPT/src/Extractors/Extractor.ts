import Conversation from "../Conversation";

class InvalidJSONForExtractor extends Error {

  json: any;
  invalidField: string;

  constructor(json: any, invalidField: string) {
    super("Failed to initialize extractor with JSON: " + JSON.stringify(json)+"\nInvalid field: "+invalidField+"\n")

    this.json = json;
    this.invalidField = invalidField;

  }
}

interface Extractor<T> {

  init: () => void;

  extract: (conversation: Conversation) => Promise<T>;

}

export default Extractor

export { Extractor, InvalidJSONForExtractor}
