import Conversation from "./Conversation";

interface Action {

  //clear for new conversation
  init: () => void;

  do: (conversation: Conversation) => void;

}

export default Action;