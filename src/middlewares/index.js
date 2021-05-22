const { customAlphabet } = require("nanoid");
const multer = require("multer");

const { alphaNumSet } = require("./../constants/index.js");
const Response = require("../response/index.js");

const { BadRequest } = Response;

function fileware(field, maxFileSize, mimeTypes) {
  const nanoid = customAlphabet(alphaNumSet, 30);

  const storage = multer.diskStorage({
    destination(req, file, cb) {
      cb(null, `static/${field}/`);
    },
    filename(req, file, cb) {
      cb(null, `${nanoid()}.${file.mimetype.split("/")[1]}`);
    },
  });

  const m = multer({
    storage,
    fileFilter(req, file, cb) {
      const allowed = mimeTypes.some((type) => type === file.mimetype);
      allowed ? cb(null, true) : cb(new Error("mimeTypeError"), false);
    },
    limits: { fileSize: maxFileSize },
  });

  return (req, res, next) => {
    m.single(field)(req, res, (err) => {
      if (err) {
        if (err.message === "mimeTypeError") {
          return res.dispatch(
            new BadRequest({
              message: `Invalid file mime type for ${field}`,
              validMimeTypes: mimeTypes,
            })
          );
        } else {
          throw err; // Review
        }
      }
      next();
    });
  };
}

module.exports = { fileware };
