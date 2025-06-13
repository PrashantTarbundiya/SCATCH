import multer from "multer";
import path from "path";
import fs from "fs";

// Ensure the temporary directory exists
const tempDir = "./public/temp";
if (!fs.existsSync(tempDir)){
    fs.mkdirSync(tempDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, tempDir);
    },
    filename: function (req, file, cb) {
      // cb(null, file.originalname) // Using original name might lead to conflicts
      cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
  });

export const upload = multer({
    storage,
});
