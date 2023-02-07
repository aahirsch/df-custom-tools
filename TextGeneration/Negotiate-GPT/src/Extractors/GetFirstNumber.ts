import Conversation from "../Conversation";
import Extractor from "./Extractor";

//extracts the first number used in the latest message
class GetFirstNumber implements Extractor<number|null> {

  init(){
    return;
  }

  extract(conversation: Conversation): Promise<number|null> {
    //get last encoded message
    const lastMessage = conversation.getLastMessage();

    //get the first number
    const matches = lastMessage.match(conversation.numberCode.findCodeRegex);

    //return the number
    if(matches==null){
      return Promise.resolve(null);
    }

    return Promise.resolve(conversation.numberCode.getNumberFromCode(matches[0])!);
  }

}

export default GetFirstNumber