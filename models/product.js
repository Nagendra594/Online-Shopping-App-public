const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const productSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  imageUrl: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
});
module.exports = mongoose.model("Product", productSchema);
// class Product {
//   constructor(title, imageUrl, price, description, id, userId) {
//     this.title = title;
//     this.imageUrl = imageUrl;
//     this.price = price;
//     this.description = description;
//     this._id = id ? new mongodb.ObjectId(id) : null;
//     this.userId = new mongodb.ObjectId(userId);
//   }
//   save() {
//     const db = getDb();
//     if (this._id) {
//       return db
//         .collection("products")
//         .updateOne({ _id: this._id }, { $set: this });
//     }
//     return db.collection("products").insertOne(this);
//   }
//   static fetchAll() {
//     const db = getDb();
//     return db.collection("products").find().toArray();
//   }
//   static fetchById(proId) {
//     const db = getDb();
//     return db
//       .collection("products")
//       .find({ _id: new mongodb.ObjectId(proId) })
//       .next();
//   }
//   static deleteById(prodId) {
//     const db = getDb();
//     return db
//       .collection("products")
//       .deleteOne({ _id: new mongodb.ObjectId(prodId) })
//       .then(() => {
//         return db.collection("users");
//       });
//   }
// }
// module.exports = Product;
