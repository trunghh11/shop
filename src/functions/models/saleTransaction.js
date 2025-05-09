export default class SaleTransaction {
    constructor({
        CreatedAt = new Date(),
        ProductID = "",
        SellerID = "",
        BuyerID = "",
        Quantity = 0,
        Price = 0,
        Status = "pending",
    })
    {
        this.CreatedAt = CreatedAt;
        this.ProductID = ProductID;
        this.SellerID = SellerID;
        this.BuyerID = BuyerID;
        this.Quantity = Quantity;
        this.Price = Price;
        this.Status = Status;
    }
    toJSON(){
        return {
            CreatedAt: this.CreatedAt,
            ProductID: this.ProductID,
            SellerID: this.SellerID,
            BuyerID: this.BuyerID,
            Quantity: this.Quantity,
            Price: this.Price,
            Status: this.Status,
        };
    }
    static fromJSON(data) {
        return new SaleTransaction({
            ...data,
            CreatedAt: data.CreatedAt instanceof Date ? data.CreatedAt : new Date(data.CreatedAt)
        });
    }
}