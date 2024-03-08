const express = require("express");
const User = require("../models/user");
const { check, body } = require("express-validator");
const authController = require("../controllers/auth");
const router = express.Router();
router.get("/login", authController.getLogin);
router.post(
  "/userLogin",
  [body("email").isEmail().withMessage("Enter Valid Email Address")],
  authController.postLoginUser
);
router.post(
  "/adminLogin",
  [body("email").isEmail().withMessage("Enter Valid Email Address")],
  authController.postLoginAdmin
);
router.post("/logout", authController.postLogout);
router.get("/signup", authController.getSignUp);
router.post(
  "/signup",
  [
    body("email")
      .isEmail()
      .withMessage("Enter Valid Email Address")
      .custom((value, { req }) => {
        return User.findOne({ email: value }).then((userDoc) => {
          if (userDoc) {
            return Promise.reject(
              "since the email you enterd is already exits, this is forbidden!"
            );
          }
          return true;
        });
      }),
    body(
      "password",
      "password should containes only text and numbers and with minimum length 5 characters"
    )
      .isLength({ min: 5 })
      .isAlphanumeric(),
    body("confirmPassword").custom((value, { req }) => {
      if (value !== req.body.password) {
        return Promise.reject("password and confirm password should match");
      }
      return true;
    }),
  ],
  authController.postSignUp
);
router.get("/reset/:type", authController.getReset);
router.post("/resetUser", authController.postResetUser);
router.post("/resetAdmin", authController.postResetAdmin);
router.get("/resetUser/:token", authController.getNewPasswordUser);
router.get("/resetAdmin/:token", authController.getNewPasswordAdmin);
router.post("/new-password/user", authController.postNewPasswordUser);
router.post("/new-password/admin", authController.postNewPasswordAdmin);
module.exports = router;
