const dns = require("node:dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const express = require("express");
const dotenv= require('dotenv');
dotenv.config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const cors = require("cors");
app.use(cors());
app.use(express.json());
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
    const carCollection = db.collection("cars");
    const carListingCollection = db.collection("carListing");
    const carBookingCollection = db.collection("carBooking")
   
    app.get("/explore", async(req, res)=>{
        const result = await carCollection.find().toArray();
        res.json(result);
    })

    // client site theke add car hote theke data ekhane explore e asbe
    app.post("/explore", async(req, res) =>{
        const carsData = req.body;
        console.log(carsData);
        const result = await carCollection.insertOne(carsData);
        res.json(result)
    })

    app.post("/listing", async(req, res) =>{
        const carsData = req.body;
        console.log(carsData);
        const result = await carListingCollection.insertOne(carsData);
        res.json(result)
    })
    app.get("/listing", async (req, res) => {
    const result = await carListingCollection.find().toArray();
    res.json(result);
    });

    app.get("/explore/:id", async(req, res) =>{
        const {id} = req.params;
        // console.log(carsData);
        const result = await carCollection.findOne({_id: new ObjectId(id)})
        res.json(result)
    })

    app.post("/carBooking", async (req, res) => {
    const bookingData = req.body;
    const result = await carBookingCollection.insertOne(bookingData);
    res.json(result);
});

    app.get("/carBooking/:userId", async (req, res) => {
    const {userId} = req.params;
    const result = await carBookingCollection.find({userId:userId}).toArray();
    res.json(result);
});


  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send(`Server is running fine`);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
