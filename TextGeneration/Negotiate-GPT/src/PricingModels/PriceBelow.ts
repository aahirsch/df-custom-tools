import AbstractPriceModel from "./AbstractPriceModel";

class PriceBelow extends AbstractPriceModel {

  constructor(limitPrice: number, nextOffer: number, offerStep: number) {
    const parametersMap: Map<string, any> = new Map<string, any>();
    parametersMap.set("limitPrice", limitPrice);
    parametersMap.set("nextOffer", nextOffer);
    parametersMap.set("offerStep", offerStep);
    super(parametersMap)
  }

  public accept(price: number) {
    return price < this.getParameter("limitPrice");
  }

  public getNewOffer() {
    const nextOffer = this.getParameter("nextOffer");

    //progress next offer
    if(nextOffer+this.getParameter("offerStep") <= this.getParameter("limitPrice")){
      this.setParameter("nextOffer", nextOffer + this.getParameter("offerStep"));
    }

    return nextOffer
  }

  static fromJSON(json: any): PriceBelow {
    const out = new PriceBelow(0, 0, 0);
    out.loadParametersFromJSON(json);
    return out;
  }

}

export default PriceBelow