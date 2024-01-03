const mongoose = require("mongoose");

const bookSchema = mongoose.Schema({
  id: { type: String },
  userId: { type: String },
  title: { type: String },
  author: { type: String },
  year: { type: Number },
  genre: { type: String },
  ratings: [
    {
      userId: { type: String },
      grade: { type: Number },
    },
  ],
  averageRating: { type: Number, default: 0 },
  imageUrl: { type: String },
});

module.exports = mongoose.model("Book", bookSchema);
