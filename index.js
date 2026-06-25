const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = 3000;
const jwtSecret = process.env.JWT_ACCESS_SECRET;

// middleware
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("This Server is Running");
});

// middleware token
const verifyToken = (req, res, next) => {
  const authorization = req.headers.authorization;

  if (!jwtSecret) {
    return res.status(500).send({ message: "JWT secret is not configured" });
  }

  if (!authorization || !authorization.startsWith("Bearer ")) {
    return res.status(401).send({ message: "unauthorized access" });
  }

  const token = authorization.split(" ")[1];

  jwt.verify(token, jwtSecret, (error, decoded) => {
    if (error) {
      return res.status(401).send({ message: "unauthorized access" });
    }

    req.decoded = decoded;
    next();
  });
};

// jwt token related api
app.post("/jwt", (req, res) => {
  const user = req.body;
  if (!jwtSecret) {
    return res.status(500).send({ message: "JWT secret is not configured" });
  }
  const token = jwt.sign(user, jwtSecret, {
    expiresIn: "7d",
  });
  res.send({ token });
});

app.get("/verify-token", verifyToken, (req, res) => {
  res.send({ valid: true, user: req.decoded });
});

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.aazhdn7.mongodb.net/?appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const servicesCollection = client.db("jesparlour").collection("services");

    app.get("/services", async (req, res) => {
      const items = req.body;
      const result = await servicesCollection.find(items).toArray();
      res.send(result);
    });

    app.get("/services/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await servicesCollection.findOne(query);
      res.send(result);
    });
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!",
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
