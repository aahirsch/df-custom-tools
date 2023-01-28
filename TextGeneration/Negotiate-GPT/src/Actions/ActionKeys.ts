import Action from "./Action";

const ActionKeys: Map<string, (JSON: any) => Action> = new Map<string, (JSON: any) => Action>()

export default ActionKeys