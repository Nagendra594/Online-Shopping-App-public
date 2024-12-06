/* we need path module for avoiding the errors related to paths with respect to OS. It will detect on which OS you are running the applicaion, then according the result it will automatically modify the path structure. like for windows("\") for macOS("/");*/
const path = require("path");

/*mongoose is library for mongoDb database. MongoDb is a dataBase which is not structured. it works with collections. Collections called as schemas*/
const mongoose = require("mongoose");

/* Express is a library for Nodejs for creating servers and manges requests*/
const express = require("express");

/* bodyParser is a module for extracting the data from the url when the client sents post requests. It only extracts the text, But not files For extractiong uploads i mean files we need another package which we discussed below*/
const bodyParser = require("body-parser");

/* multer is a module which is used to extracts the files from post requests*/
const multer = require("multer");
const multerS3 = require("multer-s3");
const s3 = require("./util/AwsS3");

/* */
const session = require("express-session");
const MongoDbStore = require("connect-mongodb-session")(session);
const csrf = require("csurf");
const flash = require("connect-flash");
const errorController = require("./controllers/error");
const User = require("./models/user");
const helmet = require("helmet");
const morgan = require("morgan");
const mongoDbUri = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_USER_PASS}@onlineapp.clluxz5.mongodb.net/${process.env.MONGO_DATABASE}`;
const app = express();
app.use(helmet());
app.use(
  helmet.contentSecurityPolicy({
    useDefaults: true,
    directives: {
      "img-src": ["'self'", "http: data:"],
    },
  })
);

app.use(morgan());
const fileStorage = multerS3({
  s3: s3,
  bucket: "onlineapp",
  acl: "public-read",
  key: function (req, file, cb) {
    cb(null, "uploads/" + Date.now() + "-" + file.originalname);
  },
});
const filter = (req, file, cb) => {
  if (
    file.mimetype === "image/jpeg" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/png"
  ) {
    return cb(null, true);
  }
  cb(null, false);
};
app.use(bodyParser.urlencoded({ extended: false }));
app.use(multer({ storage: fileStorage, fileFilter: filter }).single("image"));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname)));
const sessoinStore = new MongoDbStore({
  uri: mongoDbUri,
  collection: "session",
});
app.use(
  session({
    secret: "This is a secret",
    resave: false,
    saveUninitialized: false,
    store: sessoinStore,
  })
);
app.use(csrf());
app.use(flash());

app.set("view engine", "ejs");
app.set("views", "views");

const adminRoutes = require("./Routes/admin");
const shopRoutes = require("./Routes/shop");
const authRoutes = require("./Routes/auth");

app.use((req, res, next) => {
  res.locals.isLoggedInAsUser = req.session.isLoggedInAsUser;
  res.locals.isLoggedInAsAdmin = req.session.isLoggedInAsAdmin;
  res.locals.csrfToken = req.csrfToken();
  next();
});
app.use((req, res, next) => {
  if (!req.session.user) {
    return next();
  }
  User.findById(req.session.user._id)
    .then((user) => {
      if (!user) {
        next();
      }
      req.user = user;
      next();
    })
    .catch((err) => {
      next(new Error(err));
    });
});

app.use("/admin", adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.use(errorController.get404);

app.use((error, req, res, next) => {
  console.log(error);
  res.status(500).render("500", {
    pageTitle: "Error!",
    path: "/500",
    isLoggedInAsAdmin: false,
    isLoggedInAsUser: false,
  });
});
mongoose
  .connect(mongoDbUri)
  .then(() => {
    console.log("connected.......");
    app.listen(process.env.PORT || 3000);
  })
  .catch((err) => {
    console.log(err);
  });
