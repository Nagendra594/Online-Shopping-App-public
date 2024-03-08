const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const UserSchema = new Schema({
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  resetToken: String,
  resetTokenExpiration: Date,
  cart: {
    items: [
      {
        productId: {
          type: mongoose.Types.ObjectId,
          ref: "Product",
          required: true,
        },

        quantity: {
          type: Number,
          required: true,
        },
      },
    ],
  },
});
UserSchema.methods.addToCart = function (product) {
  const ind = this.cart.items.findIndex((cp) => {
    return cp.productId.toString() === product._id.toString();
  });
  let updatedCart = this.cart;
  if (ind != -1) {
    updatedCart.items[ind].quantity++;
  } else {
    updatedCart.items.push({
      productId: product._id,
      quantity: 1,
    });
  }
  this.cart = updatedCart;
  return this.save();
};
UserSchema.methods.deleteCartProd = function (prodId) {
  let updatedCart = this.cart.items.filter((item) => {
    return item.productId.toString() !== prodId.toString();
  });
  this.cart.items = updatedCart;
  return this.save();
};
UserSchema.methods.clearCart = function () {
  this.cart = { items: [] };
  return this.save();
};
module.exports = mongoose.model("User", UserSchema);
// const getDb = require("../util/database").getDb;
// const mondoDb = require("mongodb");
// class User {
//   constructor(name, email, id, cart) {
//     this.name = name;
//     this.email = email;
//     this.cart = cart; //{items:[{proId,quantity}]};
//     this.id = id;
//   }
//   save() {
//     const db = getDb();
//     return db.collection("users").insertOne(this);
//   }
//   static findById(userId) {
//     const db = getDb();
//     return db
//       .collection("users")
//       .findOne({ _id: new mondoDb.ObjectId(userId) });
//   }
//   addToCart(proId) {
//     const db = getDb();
//     const ind = this.cart.items.findIndex((cp) => {
//       return cp.productId.toString() === proId.toString();
//     });
//     let updatedCart = this.cart;
//     if (ind != -1) {
//       updatedCart.items[ind].quantity++;
//     } else {
//       updatedCart.items.push({
//         productId: new mondoDb.ObjectId(proId),
//         quantity: 1,
//       });
//     }
//     return db
//       .collection("users")
//       .updateOne(
//         { _id: new mondoDb.ObjectId(this.id) },
//         { $set: { cart: updatedCart } }
//       );
//   }
//   getCart() {
//     const db = getDb();
//     return new Promise((resolve, reject) => {
//       const cartPro = this.cart.items.map((item) => {
//         return db
//           .collection("products")
//           .findOne({ _id: item.productId })
//           .then((p) => {
//             return { ...p, quantity: item.quantity };
//           });
//       });
//       return Promise.all(cartPro).then((res) => resolve(res));
//     });
//   }
//   deleteCartProd(proId) {
//     const db = getDb();
//     const updatedCart = this.cart.items.filter((item) => {
//       return item.productId.toString() !== proId.toString();
//     });
//     return db
//       .collection("users")
//       .updateOne(
//         { _id: new mondoDb.ObjectId(this.id) },
//         { $set: { cart: { items: updatedCart } } }
//       );
//   }
//   addToOrder() {
//     const db = getDb();
//     return this.getCart()
//       .then((products) => {
//         const Orders = {
//           items: products,
//           user: {
//             _id: new mondoDb.ObjectId(this.id),
//             name: this.name,
//           },
//         };
//         return db.collection("orders").insertOne(Orders);
//       })
//       .then(() => {
//         return db
//           .collection("users")
//           .updateOne(
//             { _id: new mondoDb.ObjectId(this.id) },
//             { $set: { cart: { items: [] } } }
//           );
//       });
//   }
//   getOrders() {
//     const db = getDb();
//     return db
//       .collection("orders")
//       .find({ "user._id": new mondoDb.ObjectId(this.id) })
//       .toArray();
//   }
// }

// // {items:[],user:{
// //   _id:"",
// //   username:"",
// // }}

// module.exports = User;
