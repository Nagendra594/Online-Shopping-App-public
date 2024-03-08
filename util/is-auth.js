module.exports = (req, res, next) => {
  if (!req.session.isLoggedInAsAdmin && !req.session.isLoggedInAsUser) {
    console.log("Not Authenticated");
    return res.redirect("/login");
  }
  console.log("Authenticated");
  next();
};
