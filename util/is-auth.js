module.exports = (req, res, next) => {
  if (!req.session.isLoggedInAsAdmin && !req.session.isLoggedInAsUser) {
    return res.redirect("/login");
  }
  next();
};
