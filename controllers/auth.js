const User = require("../models/user");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const { validationResult } = require("express-validator");
const sendGridTranport = require("nodemailer-sendgrid-transport");
const Admin = require("../models/admin");

const transporter = nodemailer.createTransport(
  sendGridTranport({
    auth: {
      api_key:
        "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",
    },
  })
);
exports.getLogin = (req, res, next) => {
  let errorMessage = req.flash("error");
  let successMessage = req.flash("success");
  if (errorMessage.length > 0) {
    errorMessage = errorMessage[0];
  } else {
    errorMessage = null;
  }
  if (successMessage.length > 0) {
    successMessage = successMessage[0];
  } else {
    successMessage = null;
  }
  res.render("auth/login", {
    path: "/login",
    pageTitle: "Login",
    errorMessage: errorMessage,
    successMessage: successMessage,
    oldInput: {
      email: "",
      password: "",
    },
    validationError: "",
    loginSwitcher: "user",
  });
};
exports.postLoginUser = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render("auth/login", {
      path: "/login",
      pageTitle: "Login",
      errorMessage: errors.array()[0].msg,
      successMessage: "",
      oldInput: {
        email: email,
        password: password,
      },
      validationError: errors.array()[0].path,
      loginSwitcher: "user",
    });
  }
  User.findOne({ email: email })
    .then((user) => {
      if (!user) {
        return res.status(422).render("auth/login", {
          path: "/login",
          pageTitle: "Login",
          errorMessage: "User Does Not Exists, Please Sign Up!",
          successMessage: "",
          oldInput: {
            email: email,
            password: password,
          },
          validationError: "email",
          loginSwitcher: "user",
        });
      }
      return bcrypt
        .compare(password, user.password)
        .then((doMatch) => {
          if (doMatch) {
            req.session.user = user;
            req.session.isLoggedInAsUser = true;
            req.session.isLoggedInAsAdmin = false;
            return req.session.save((err) => {
              if (err) {
                return next(err);
              }
              res.redirect("/");
            });
          }
          return res.status(422).render("auth/login", {
            path: "/login",
            pageTitle: "Login",
            errorMessage: "Wrong Password",
            successMessage: "",
            oldInput: {
              email: email,
              password: password,
            },
            validationError: "password",
            loginSwitcher: "user",
          });
        })
        .catch((err) => {
          const error = new Error(err);
          error.httpStatusCode = 500;
          return next(error);
        });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postLoginAdmin = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render("auth/login", {
      path: "/login",
      pageTitle: "Login",
      errorMessage: errors.array()[0].msg,
      successMessage: "",
      oldInput: {
        email: email,
        password: password,
      },
      validationError: errors.array()[0].path,
      loginSwitcher: "admin",
    });
  }
  Admin.findOne({ email: email })
    .then((user) => {
      if (!user) {
        return res.status(422).render("auth/login", {
          path: "/login",
          pageTitle: "Login",
          errorMessage: "Invalid Email",
          successMessage: "",
          oldInput: {
            email: email,
            password: password,
          },
          validationError: "email",
          loginSwitcher: "admin",
        });
      }
      return bcrypt
        .compare(password, user.password)
        .then((doMatch) => {
          if (doMatch) {
            req.session.admin = user;
            req.session.isLoggedInAsAdmin = true;
            req.session.isLoggedInAsUser = false;
            return req.session.save((err) => {
              if (err) {
                return next(err);
              }

              res.redirect("/admin/products");
            });
          }
          return res.status(422).render("auth/login", {
            path: "/login",
            pageTitle: "Login",
            errorMessage: "Wrong Password",
            successMessage: "",
            oldInput: {
              email: email,
              password: password,
            },
            validationError: "password",
            loginSwitcher: "admin",
          });
        })
        .catch((err) => {
          const error = new Error(err);
          error.httpStatusCode = 500;
          return next(error);
        });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postLogout = (req, res, next) => {
  req.session.destroy((err) => {
    if (err) {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    }
    res.redirect("/login");
  });
};

exports.getSignUp = (req, res, next) => {
  let errorMessage = req.flash("error");
  if (errorMessage.length > 0) {
    errorMessage = errorMessage[0];
  } else {
    errorMessage = null;
  }
  res.render("auth/signup", {
    path: "/signup",
    pageTitle: "signup",
    errorMessage: errorMessage,
    oldInput: {
      email: "",
      password: "",
      confirmPassword: "",
    },
    validationError: "",
  });
};
exports.postSignUp = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render("auth/signup", {
      path: "/signup",
      pageTitle: "signup",
      errorMessage: errors.array()[0].msg,
      oldInput: {
        email: email,
        password: password,
        confirmPassword: req.body.confirmPassword,
      },
      validationError: errors.array()[0].path,
    });
  }
  bcrypt
    .hash(password, 12)
    .then((hashedPassword) => {
      const user = new User({
        email: email,
        password: hashedPassword,
        cart: { items: [] },
      });
      return user.save().then(() => {
        req.flash("success", "User created! Now you can Login");
        res.redirect("/login");
        return transporter
          .sendMail({
            to: email,
            from: "chnagendra594@gmail.com",
            subject: "Signup Succeded!",
            html: "<h1>Successfully created account in My online app</h1>",
          })
          .catch((err) => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
          });
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getReset = (req, res, next) => {
  let errorMessage = req.flash("error");
  let successMessage = req.flash("success");
  if (errorMessage.length > 0) {
    errorMessage = errorMessage[0];
  } else {
    errorMessage = null;
  }
  if (successMessage.length > 0) {
    successMessage = successMessage[0];
  } else {
    successMessage = null;
  }
  res.render("auth/resetPassword", {
    path: "/reset",
    pageTitle: "Reset Password",
    errorMessage: errorMessage,
    successMessage: successMessage,
    type: req.params.type,
  });
};

exports.postResetUser = (req, res, next) => {
  let email = req.body.email;
  User.findOne({ email: email })
    .then((user) => {
      if (!user) {
        req.flash("error", "No account found with that email");
        return res.redirect("/reset/user");
      }
      crypto.randomBytes(32, (err, buffer) => {
        if (err) {
          return res.redirect("/reset/user");
        }

        let token = buffer.toString("hex");
        user.resetToken = token;
        user.resetTokenExpiration = Date.now() + 3600000;
        return user
          .save()
          .then(() => {
            req.flash(
              "success",
              "An email is sent with the password reset link"
            );
            res.redirect("/reset/user");
            return transporter
              .sendMail({
                to: email,
                from: "chnagendra594@gmail.com",
                subject: "Password reset",
                html: `
            <p>You requested to reset the password</p>
            <p>Click this <a href="http://localhost:3000/resetUser/${token}">link</a> to reset the password</p>
          `,
              })
              .catch((err) => {
                const error = new Error(err);
                error.httpStatusCode = 500;
                return next(error);
              });
          })
          .catch((err) => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
          });
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postResetAdmin = (req, res, next) => {
  let email = req.body.email;
  Admin.findOne({ email: email })
    .then((user) => {
      if (!user) {
        req.flash("error", "No account found with that email");
        return res.redirect("/reset/admin");
      }
      crypto.randomBytes(32, (err, buffer) => {
        if (err) {
          return res.redirect("/reset/admin");
        }

        let token = buffer.toString("hex");
        user.resetToken = token;
        user.resetTokenExpiration = Date.now() + 3600000;
        return user
          .save()
          .then(() => {
            req.flash(
              "success",
              "An email is sent with the password reset link"
            );
            res.redirect("/reset/admin");
            return transporter
              .sendMail({
                to: email,
                from: "chnagendra594@gmail.com",
                subject: "Password reset",
                html: `
            <p>You requested to reset the password</p>
            <p>Click this <a href="http://localhost:3000/resetAdmin/${token}">link</a> to reset the password</p>
          `,
              })
              .catch((err) => {
                const error = new Error(err);
                error.httpStatusCode = 500;
                return next(error);
              });
          })
          .catch((err) => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
          });
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getNewPasswordUser = (req, res, next) => {
  let token = req.params.token;
  User.findOne({
    resetToken: token,
    resetTokenExpiration: { $gt: Date.now() },
  })
    .then((user) => {
      if (!user) {
        req.flash("error", "Link was expired. Please generate a new Link");
        return res.redirect("/reset/user");
      }
      return res.render("auth/new-password", {
        path: "/new password",
        pageTitle: "New Password",
        userId: user._id.toString(),
        passwordToken: token,
        type: "user",
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};
exports.getNewPasswordAdmin = (req, res, next) => {
  let token = req.params.token;
  Admin.findOne({
    resetToken: token,
    resetTokenExpiration: { $gt: Date.now() },
  })
    .then((user) => {
      if (!user) {
        req.flash("error", "Link was expired. Please generate a new Link");
        return res.redirect("/reset/admin");
      }
      return res.render("auth/new-password", {
        path: "/new password",
        pageTitle: "New Password",
        userId: user._id.toString(),
        passwordToken: token,
        type: "admin",
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postNewPasswordUser = (req, res, next) => {
  const userId = req.body.userId;
  const password = req.body.password;
  const passwordToken = req.body.passwordToken;
  User.findOne({
    _id: userId,
    resetToken: passwordToken,
    resetTokenExpiration: { $gt: Date.now() },
  })
    .then((user) => {
      if (!user) {
        req.flash("error", "Link was expired. Please generate a new Link");
        return res.redirect("/reset/user");
      }
      return bcrypt
        .hash(password, 12)
        .then((hashedPassword) => {
          user.password = hashedPassword;
          user.resetToken = undefined;
          user.resetTokenExpiration = undefined;
          return user.save();
        })
        .catch((err) => {
          const error = new Error(err);
          error.httpStatusCode = 500;
          return next(error);
        });
    })
    .then(() => {
      req.flash("success", "Password updated successfully...");
      res.redirect("/login");
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};
exports.postNewPasswordAdmin = (req, res, next) => {
  const userId = req.body.userId;
  const password = req.body.password;
  const passwordToken = req.body.passwordToken;
  Admin.findOne({
    _id: userId,
    resetToken: passwordToken,
    resetTokenExpiration: { $gt: Date.now() },
  })
    .then((user) => {
      if (!user) {
        req.flash("error", "Link was expired. Please generate a new Link");
        return res.redirect("/reset/admin");
      }
      return bcrypt
        .hash(password, 12)
        .then((hashedPassword) => {
          user.password = hashedPassword;
          user.resetToken = undefined;
          user.resetTokenExpiration = undefined;
          return user.save();
        })
        .catch((err) => {
          const error = new Error(err);
          error.httpStatusCode = 500;
          return next(error);
        });
    })
    .then(() => {
      req.flash("success", "Password updated successfully...");
      res.redirect("/login");
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};
