// models/exchangeTransaction.js
export default class ExchangeTransaction {
  constructor({
    ExchangeID = "",
    CreatedAt = new Date(),
    ProductID1 = "",
    ProductID2 = "",
    Quantity1 = "",
    Quantity2 = "",
    Status = "pending",
    User1ID = "",
    User2ID = ""
  }) {
    this.ExchangeID = ExchangeID;
    this.CreatedAt = CreatedAt;
    this.ProductID1 = ProductID1;
    this.ProductID2 = ProductID2;
    this.Quantity1 = Quantity1;
    this.Quantity2 = Quantity2;
    this.Status = Status;
    this.User1ID = User1ID;
    this.User2ID = User2ID;
  }

  toJSON() {
    return {
      ExchangeID: this.ExchangeID,
      CreatedAt: this.CreatedAt,
      ProductID1: this.ProductID1,
      ProductID2: this.ProductID2,
      Quantity1: this.Quantity1,
      Quantity2: this.Quantity2,
      Status: this.Status,
      User1ID: this.User1ID,
      User2ID: this.User2ID,
    };
  } 

  static fromJSON(data) {
    return new ExchangeTransaction({
      ...data,
      CreatedAt: data.CreatedAt instanceof Date ? data.CreatedAt : new Date(data.CreatedAt)
    });
  }
}
