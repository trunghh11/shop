/**
 * Product Model
 * Represents products available in the system
 */
class Product {
  constructor({
    CategoryID = "",
    Condition = "",
    Description = "",
    FundID = "",
    PostID = "",
    Price = 0,
    ProductName = "",
    Stock = 0,
    image = [],
    showOnHome = false
  }) {
    this.CategoryID = CategoryID; // ID of the product category
    this.Condition = Condition; // Condition of the product (e.g., 'new', 'used')
    this.Description = Description; // Detailed description of the product
    this.FundID = FundID; // ID related to product funding or financial aspects
    this.PostID = PostID; // ID of the associated post
    this.Price = Price; // Price of the product as a number
    this.ProductName = ProductName; // Name of the product
    this.Stock = Stock; // Quantity available in stock
    this.image = Array.isArray(image) ? image : []; // Array of image URLs
    this.showOnHome = Boolean(showOnHome); // Whether to show product on homepage
  }

  /**
   * Converts the product to a database compatible object
   */
  toJSON() {
    return {
      CategoryID: this.CategoryID,
      Condition: this.Condition,
      Description: this.Description,
      FundID: this.FundID,
      PostID: this.PostID,
      Price: this.Price,
      ProductName: this.ProductName,
      Stock: this.Stock,
      image: this.image,
      showOnHome: this.showOnHome,
    };
  }

  /**
   * Creates a product instance from database data
   */
  static fromJSON(data) {
    return new Product({
      ...data,
      Price: Number(data.Price), // Ensure Price is a number
      Stock: Number(data.Stock), // Ensure Stock is a number
      image: Array.isArray(data.image) ? data.image : [], // Ensure image is an array
      showOnHome: Boolean(data.showOnHome) // Ensure showOnHome is a boolean
    });
  }
}

module.exports = Product;
