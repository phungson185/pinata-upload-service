const express = require("express");
const PinataSDK = require("@pinata/sdk");
const swaggerUi = require("swagger-ui-express");
const YAML = require("yamljs");
const multer = require("multer");
const fs = require("fs");
const os = require("os");

const app = express();
app.use(express.json());

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

const pinata = new PinataSDK({
  pinataApiKey: "a2ab512717deaaf6ae96",
  pinataSecretApiKey:
    "05fe5f3a5ef0f022463d86e725bbd5e4feb0fcb8dfd71f0c75ea8643931de80a",
});

const upload = multer({ dest: os.tmpdir() });

const swaggerDocument = YAML.load("./swagger.yaml");
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.post("/pinata/upload", upload.single("file"), async (req, res) => {
  try {
    const readStream = fs.createReadStream(req.file.path);
    const options = {
      pinataMetadata: {
        name: req.file.originalname,
      },
      pinataOptions: {
        cidVersion: 0,
      },
    };
    const result = await pinata.pinFileToIPFS(readStream, options);
    res.json({
      success: true,
      data: {
        pinataUrl: `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`,
      },
    });
  } catch (err) {
    res.json({
      success: false,
      errors: err,
    });
  }
});

// const data = {
//   name: `A custom name. If you don't provide this value, it will automatically be populated by the original name of the file you've uploaded`,
//   keyvalues: {
//     customKey: "customValue",
//     customKey2: "customValue2",
//   },
// };

app.post("/pinata/metadata", async (req, res) => {
  try {
    console.log("req.body", req.body);
    const metadata = req.body;
    const options = {
      pinataMetadata: metadata,
      pinataOptions: {
        cidVersion: 0,
      },
    };
    const result = await pinata.pinJSONToIPFS(metadata, options);
    res.json({
      success: true,
      data: {
        pinataUrl: `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`,
      },
    });
  } catch (err) {
    res.json({
      success: false,
      errors: err,
    });
  }
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
