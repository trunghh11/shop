/**
 * User Model
 * Represents user profiles in the system
 */
class User {
  constructor({
    UserID = 0,
    RatingCount = "",
    Phone = "",
    Name = "",
    FacebookLink = "",
    Email = "",
    Class = "",
    AvgRating = "",
    notifications = []
  }) {
    this.UserID = UserID; // Unique numeric identifier for the user
    this.RatingCount = RatingCount; // Count of ratings received by the user
    this.Phone = Phone; // User's phone number
    this.Name = Name; // User's full name
    this.FacebookLink = FacebookLink; // Link to user's Facebook profile
    this.Email = Email; // User's email address
    this.Class = Class; // User's class or category
    this.AvgRating = AvgRating; // Average rating of the user
    this.notifications = notifications;

  }

  /**
   * Converts the user to a database compatible object
   */
  toJSON() {
    return {
      UserID: this.UserID,
      RatingCount: this.RatingCount,
      Phone: this.Phone,
      Name: this.Name,
      FacebookLink: this.FacebookLink,
      Email: this.Email,
      Class: this.Class,
      AvgRating: this.AvgRating,
    };
  }

  /**
   * Creates a user instance from database data
   */
  static fromJSON(data) {
    return new User({
      ...data,
      UserID: Number(data.UserID) // Ensure UserID is a number
    });
  }
}

module.exports = User;
