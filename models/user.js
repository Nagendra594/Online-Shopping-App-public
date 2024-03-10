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
