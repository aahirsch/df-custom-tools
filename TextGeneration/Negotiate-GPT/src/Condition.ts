import Conversation from "./Conversation";

interface Condition {

  //clear for new conversation
  init: () => void;

  afterUserMessageCheck: (conversation: Conversation) => Promise<boolean>;

  afterBotMessageCheck: (conversation: Conversation) => Promise<boolean>;

}

export default Condition;