/**
 * Post Model
 * Represents posts/product announcements in the system
 */
class Post {
  constructor({
    Content = "",
    CreatedAt = new Date(),
    PosterID = "",
    ReviewerID = null,
    Status = "Đang xét duyệt",
  }) {
    this.Content = Content; // Nội dung bài đăng
    this.CreatedAt = CreatedAt; // Thời gian tạo bài đăng
    this.PosterID = PosterID; // ID của người đăng (user ID)
    this.ReviewerID = ReviewerID; // ID của người duyệt bài (admin/moderator ID)
    this.Status = Status; // Trạng thái bài đăng ('Đang xét duyệt', 'Đã phê duyệt', 'Đã từ chối')
  }

  /**
   * Chuyển đổi đối tượng Post thành định dạng phù hợp với cơ sở dữ liệu
   */
  toJSON() {
    return {
      Content: this.Content,
      CreatedAt: this.CreatedAt,
      PosterID: this.PosterID,
      ReviewerID: this.ReviewerID,
      Status: this.Status,
    };
  }

  /**
   * Tạo đối tượng Post từ dữ liệu cơ sở dữ liệu
   */
  static fromJSON(data) {
    return new Post({
      ...data,
      // Chuyển đổi CreatedAt từ timestamp Firestore thành đối tượng Date nếu cần
      CreatedAt: data.CreatedAt instanceof Date 
        ? data.CreatedAt 
        : data.CreatedAt?.toDate?.() || new Date(),
    });
  }
}
module.exports = Post;

