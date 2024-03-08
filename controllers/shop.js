const Product = require("../models/product");
const Order = require("../models/order");
const fs = require("fs");
const PdfDocument = require("pdfkit");
const path = require("path");
let items_per_page = 3;
exports.getProducts = (req, res, next) => {
  let pageNo = +req.query.page;
  if (!pageNo) {
    pageNo = 1;
  }
  let totalProducts;
  Product.find()
    .countDocuments()
    .then((numOfProducts) => {
      totalProducts = numOfProducts;
      return Product.find()
        .skip((pageNo - 1) * items_per_page)
        .limit(items_per_page);
    })
    .then((products) => {
      res.render("shop/product-list", {
        prods: products,
        pageTitle: "All Products",
        path: "/products",
        hasNext: pageNo < Math.ceil(totalProducts / items_per_page),
        hasPrev: pageNo > 1,
        curPage: pageNo,
        lastPage: Math.ceil(totalProducts / items_per_page),
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getProduct = (req, res, next) => {
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then((product) => {
      res.render("shop/product-detail", {
        product: product,
        pageTitle: product.title,
        path: "/products",
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getIndex = (req, res, next) => {
  let pageNo = +req.query.page;
  if (!pageNo) {
    pageNo = 1;
  }
  let totalProducts;
  Product.find()
    .countDocuments()
    .then((numOfProducts) => {
      totalProducts = numOfProducts;
      return Product.find()
        .skip((pageNo - 1) * items_per_page)
        .limit(items_per_page);
    })
    .then((products) => {
      res.render("shop/index", {
        prods: products,
        pageTitle: "Shop",
        path: "/",
        hasNext: pageNo < Math.ceil(totalProducts / items_per_page),
        hasPrev: pageNo > 1,
        curPage: pageNo,
        lastPage: Math.ceil(totalProducts / items_per_page),
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getCart = (req, res, next) => {
  req.user
    .populate("cart.items.productId")
    .then((user) => {
      let products = user.cart.items;
      res.render("shop/cart", {
        path: "/cart",
        pageTitle: "Your Cart",
        products: products,
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postCart = (req, res, next) => {
  const prodId = req.body.productId;
  Product.findById(prodId)
    .then((product) => {
      return req.user.addToCart(product);
    })
    .then(() => {
      res.redirect("/cart");
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postCartDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId;

  req.user
    .deleteCartProd(prodId)
    .then((result) => {
      res.redirect("/cart");
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getCheckout = (req, res, next) => {
  req.user
    .populate("cart.items.productId")
    .then((user) => {
      let totalsum = 0;
      let products = user.cart.items;
      products.forEach((pro) => {
        totalsum += pro.productId.price * pro.quantity;
      });
      res.render("shop/checkout", {
        path: "/checkout",
        pageTitle: "checkout",
        products: products,
        totalSum: totalsum,
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};
exports.postOrder = (req, res, next) => {
  req.user
    .populate("cart.items.productId")
    .then((userData) => {
      const products = userData.cart.items.map((i) => {
        return { quantity: i.quantity, product: { ...i.productId } };
      });
      const order = new Order({
        user: req.user,
        items: products,
      });
      return order.save();
    })
    .then(() => {
      return req.user.clearCart();
    })
    .then(() => {
      res.redirect("/orders");
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getOrders = (req, res, next) => {
  Order.find({ user: req.user._id })
    .then((orderedItems) => {
      res.render("shop/orders", {
        path: "/orders",
        pageTitle: "Your Orders",
        orders: orderedItems,
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getInvoice = (req, res, next) => {
  const orderID = req.params.orderId;
  Order.findById(orderID)
    .then((order) => {
      if (!order) {
        return next(new Error("No order Found!"));
      }
      if (order.user.toString() !== req.user._id.toString()) {
        return next(new Error("Unauthorized"));
      }
      const fileName = "invoice-" + orderID + ".pdf";
      const filePath = path.join("data", fileName);
      const pdfDoc = new PdfDocument();
      pdfDoc.pipe(fs.createWriteStream(filePath));
      pdfDoc.pipe(res);
      pdfDoc.fontSize(26).text("INVOICE");
      pdfDoc.text("------------------------------");
      let totalPrice = 0;
      order.items.forEach((item) => {
        totalPrice += item.quantity * item.product.price;
        pdfDoc
          .fontSize(12)
          .text(
            `${item.product.title} - ${item.quantity} X ${
              item.product.price
            } = ${item.quantity * item.product.price}`
          );
      });
      pdfDoc.text("----");
      pdfDoc.fontSize(20).text(`Total Price = $${totalPrice}`);
      pdfDoc.end();
    })
    .catch((err) => {
      next(err);
    });
};
