const Product = require("../models/product");
const Order = require("../models/order");
const PdfDocument = require("pdfkit");
const s3 = require("../util/AwsS3");
const { PutObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
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
  const pdfDoc = new PdfDocument();
  const invoiceStore = [];
  let orderId;
  pdfDoc.on("data", (chunk) => invoiceStore.push(chunk));
  pdfDoc.fontSize(26).text("INVOICE");
  pdfDoc.text("------------------------------");
  let totalPrice = 0;
  req.user
    .populate("cart.items.productId")
    .then((userData) => {
      const products = userData.cart.items.map((i) => {
        totalPrice += i.quantity * i.productId.price;
        pdfDoc
          .fontSize(12)
          .text(
            `${i.productId.title} - ${i.quantity} X ${i.productId.price} = ${
              i.quantity * i.productId.price
            }`
          );
        return { quantity: i.quantity, product: { ...i.productId } };
      });
      pdfDoc.text("----");
      pdfDoc.fontSize(20).text(`Total Price = $${totalPrice}`);
      const order = new Order({
        user: req.user,
        items: products,
      });
      return order.save();
    })
    .then((orderDoc) => {
      orderId = orderDoc._id;
      pdfDoc.end();
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
  pdfDoc.on("end", () => {
    const pdf = Buffer.concat(invoiceStore);
    const uploadParams = {
      Bucket: "onlineapp",
      Key: "invoices/" + orderId + ".pdf", // Replace with the desired S3 key
      Body: pdf,
      ContentType: "application/pdf",
    };
    try {
      const uploadCommand = new PutObjectCommand(uploadParams);
      s3.send(uploadCommand);
    } catch (err) {
      next(err);
    }
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
      const key = "invoices/" + orderID + ".pdf";
      const getParams = {
        Bucket: "onlineapp",
        Key: key,
      };
      const getCommand = new GetObjectCommand(getParams);
      return s3.send(getCommand);
    })
    .then((result) => {
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        'inline; filename="' + orderID + ".pdf"
      );
      result.Body.pipe(res);
    })
    .catch((err) => {
      next(err);
    });
};
