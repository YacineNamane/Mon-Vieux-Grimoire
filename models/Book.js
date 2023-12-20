const mongoose = require("mongoose");

const bookSchema = mongoose.Schema({
  id: { type: String },
  userId: { type: String },
  title: { type: String },
  author: { type: String },
  imageUrl: { type: String },
  year: { type: Number },
  genre: { type: String },
  ratings: [
    {
      userId: { type: String },
      grade: { type: Number },
    },
  ],
  averageRating: { type: Number, default: 0 },
});

module.exports = mongoose.model("Book", bookSchema);
