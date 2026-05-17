const dns = require("node:dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const express = require("express");
const { MongoClient, ServerApiVersion } = require('mongodb');
const app = express();
const dotenv= require('dotenv');
dotenv.config();
const cors = require("cors");
const PORT =process.env.PORT

// const uri ="mongodb+srv://assignment-9:Voz7wAHJDbbqjxfj@tawsifop.5z3mddc.mongodb.net/?appName=TawsifOp"
const uri =process.env.MONGODB_URI

// mongodb://assignment-9:Voz7wAHJDbbqjxfj@ac-lbnmscj-shard-00-00.5z3mddc.mongodb.net:27017,ac-lbnmscj-shard-00-01.5z3mddc.mongodb.net:27017,ac-lbnmscj-shard-00-02.5z3mddc.mongodb.net:27017/?ssl=true&replicaSet=atlas-fpr7ry-shard-0&authSource=admin&appName=TawsifOp

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const db = client.db("assignment-9");
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send(`Server is running fine`);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
