const Product = require("../models/product");
const User = require("../models/user");
const fileManager = require("../util/file");
const { validationResult } = require("express-validator");
exports.getAddProduct = (req, res, next) => {
  res.render("admin/edit-product", {
    pageTitle: "Add Product",
    path: "/admin/add-product",
    editing: false,
    hasError: false,
    validationError: "",
    errorMessage: "",
  });
};

exports.postAddProduct = (req, res, next) => {
  console.log("........................");
  const title = req.body.title;
  const image = req.file;
  const price = req.body.price;
  const description = req.body.description;
  const errors = validationResult(req);
  if (!errors.isEmpty() || !image) {
    return res.status(422).render("admin/edit-product", {
      pageTitle: "Add Product",
      path: "/admin/add-product",
      editing: false,
      hasError: true,
      validationError: !image ? "" : errors.array()[0].path,
      errorMessage: !image
        ? "Attached File is not supported! Only jpg,jpeg,png is supported"
        : errors.array()[0].msg,
      product: {
        title: title,
        price: price,
        description: description,
      },
    });
  }
  const product = new Product({
    title: title,
    imageUrl: image.path,
    price: price,
    description: description,
  });
  product
    .save()
    .then(() => {
      return res.redirect("/admin/products");
    })
    .catch((err) => {
      console.log(err);
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getEditProduct = (req, res, next) => {
  const editMode = req.query.edit;
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then((product) => {
      if (!product) {
        return res.redirect("/");
      }
      res.render("admin/edit-product", {
        pageTitle: "Edit Product",
        path: "/admin/edit-product",
        editing: editMode,
        hasError: false,
        product: product,
        validationError: "",
        errorMessage: "",
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postEditProduct = (req, res, next) => {
  const prodId = req.body.productId;
  const updatedTitle = req.body.title;
  const updatedPrice = req.body.price;
  const updatedImage = req.file;
  const updatedDesc = req.body.description;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render("admin/edit-product", {
      pageTitle: "edit Product",
      path: "/admin/edit-product",
      editing: true,
      hasError: true,
      validationError: errors.array()[0].path,
      errorMessage: errors.array()[0].msg,
      product: {
        title: updatedTitle,
        price: updatedPrice,
        description: updatedDesc,
        _id: prodId,
      },
    });
  }
  Product.findById(prodId)
    .then((product) => {
      if (!product) {
        return new Error("No product found!");
      }
      product.title = updatedTitle;
      product.price = updatedPrice;
      product.description = updatedDesc;
      if (updatedImage) {
        fileManager.deleteFile(product.imageUrl);
        product.imageUrl = updatedImage.path;
      }
      return product.save();
    })
    .then(() => {
      res.redirect("/admin/products");
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

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
      res.render("admin/products", {
        prods: products,
        pageTitle: "Admin Products",
        path: "/admin/products",
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

exports.postDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId;
  Product.findById(prodId)
    .then((product) => {
      if (!product) {
        return new Error("No product Found!");
      }
      fileManager.deleteFile(product.imageUrl);
      return Product.findByIdAndDelete(prodId);
    })
    .then(() => {
      return User.updateMany(
        { "cart.items.productId": prodId },
        { $pull: { "cart.items": { productId: prodId } } }
      );
    })
    .then(() => {
      res.redirect("/admin/products");
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};
