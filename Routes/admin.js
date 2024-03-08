const path = require("path");

const { body } = require("express-validator");

const express = require("express");

const adminController = require("../controllers/admin");

const router = express.Router();
const isAuth = require("../util/is-auth");
// /admin/add-product => GET
router.get("/add-product", isAuth, adminController.getAddProduct);

// // /admin/products => GET
router.get("/products", adminController.getProducts);

// // /admin/add-product => POST
router.post(
  "/add-product",
  [
    body("title", "please Provide Valid title")
      .isString()
      .isLength({ min: 3 })
      .trim(),
    body("price", "please Provide Valid price").isFloat().trim(),
    body("description", "please Provide Valid description")
      .isLength({ min: 3, max: 400 })
      .trim(),
  ],
  isAuth,
  adminController.postAddProduct
);

router.get("/edit-product/:productId", isAuth, adminController.getEditProduct);

router.post(
  "/edit-product",
  [
    body("title", "please Provide Valid title")
      .isString()
      .isLength({ min: 3 })
      .trim(),
    body("price", "please Provide Valid price").isFloat().trim(),
    body("description", "please Provide Valid description")
      .isLength({ min: 3, max: 400 })
      .trim(),
  ],
  isAuth,
  adminController.postEditProduct
);

router.post("/delete/product", isAuth, adminController.postDeleteProduct);

module.exports = router;
