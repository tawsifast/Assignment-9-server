const dns = require("node:dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const express = require("express");
const dotenv= require('dotenv');
dotenv.config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const cors = require("cors");
const { createRemoteJWKSet, jwtVerify } = require("jose-cjs");
app.use(cors());
app.use(express.json());
const PORT =process.env.PORT


const uri =process.env.MONGODB_URI



const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const CLIENT_URL = process.env.CLIENT_URL || (process.env.NODE_ENV === "production"
  ? "https://drive-fleet-zeta.vercel.app"
  : "http://localhost:3000");

const JWKS = createRemoteJWKSet(
  new URL(`${CLIENT_URL}/api/auth/jwks`)
)

const authenticate = async (req, res, next) => {
  const authHeader = req?.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "unauthorized" });
  const token = authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ message: "unauthorized" });
  try {
    const { payload } = await jwtVerify(token, JWKS);
    req.user = payload;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Forbidden" });
  }
};

const requireAdmin = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Forbidden: Admin only" });
  }
  next();
};

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const db = client.db("assignment-9");
    const carCollection = db.collection("cars");
    const carListingCollection = db.collection("carListing");
    const carBookingCollection = db.collection("carBooking");
    const userCollection = db.collection("user");
   
    // app.get("/explore", async(req, res)=>{
    //     const result = await carCollection.find().toArray();
    //     res.json(result);
    // })

    // client site theke add car hote theke data ekhane explore e asbe
    app.post("/explore", authenticate, requireAdmin, async(req, res) =>{
        const carsData = req.body;
        console.log(carsData);
        const existing = await carCollection.findOne({ image: carsData.image });
    
        if(existing) {
        return res.status(409).json({ message: "This car already exists!" });
        }
        const result = await carCollection.insertOne(carsData);
        res.json(result)
    })

    

    app.get("/explore/:id", authenticate, async(req, res) =>{
        const {id} = req.params;
        // console.log(carsData);
        const result = await carCollection.findOne({_id: new ObjectId(id)})
        res.json(result)
    })

   app.post("/carBooking", authenticate, async (req, res) => {
  const bookingData = { ...req.body, status: "pending" };
  const existing = await carBookingCollection.findOne({
    userId: bookingData.userId,
    carId: bookingData.carId
  });

  if(existing) {
    return res.status(409).json({ message: "You already booked this car!" });
  }

  const result = await carBookingCollection.insertOne(bookingData);


  await carCollection.updateOne(
    { _id: new ObjectId(bookingData.carId) },
    { $inc: { booking_count: 1 } }
  );

  await carListingCollection.updateOne(
    { _id: new ObjectId(bookingData.carId) },
    { $inc: { booking_count: 1 } }
  );

  res.json(result);
});

    app.get("/carBooking/:userId", authenticate,  async (req, res) => {
    const {userId} = req.params;
    const result = await carBookingCollection.find({userId:userId}).toArray();
    res.json(result);
  });

    app.delete("/carBooking/:id", authenticate, async(req, res)=>{
      const {id} = req.params;
      const result = await carBookingCollection.deleteOne({_id: new ObjectId(id)})
      res.json(result);
    })

    app.post("/listing", authenticate, async(req, res) =>{
        const carsData = req.body;
        console.log(carsData);
        const existing = await carListingCollection.findOne({image: carsData.image,
        userId: carsData.userId 
        });
    
        if(existing) {
        return res.status(409).json({ message: "Already in your listing!" });
        }
        const result = await carListingCollection.insertOne(carsData);
        res.json(result)
    })

    app.get("/listing", async(req, res) =>{
        const result = await carListingCollection.find().toArray();
        res.json(result);
    })

    app.get("/listing/:userId", authenticate,  async (req, res) => {
    const {userId} = req.params;
    const result = await carListingCollection.find({userId:userId}).toArray();
    res.json(result);
    });

    // app.delete("/explore/:id", async(req, res)=>{
    //   const {id} = req.params;
    //   const result = await carCollection.deleteOne({_id: new ObjectId(id)});
    //   res.json(result);
    // })

    // app.delete("/listing/:id", async(req, res)=>{
    //   const {id} = req.params;
    //   const result = await carListingCollection.deleteOne({_id: new ObjectId(id)});
    //   res.json(result);
    // })

    app.delete("/listing/:id", authenticate, async(req, res) => {
    const {id} = req.params;

    // lsiting theke explore Id ber kora
    const listing = await carListingCollection.findOne({_id: new ObjectId(id)});
    const exploreId = listing?.exploreId;

    // 2 collection theke delete
    const listingResult = await carListingCollection.deleteOne({_id: new ObjectId(id)});
    
    if(exploreId) {
        await carCollection.deleteOne({_id: new ObjectId(exploreId)});
    }

    res.json(listingResult);
})


  app.patch("/listing/:id", authenticate, async(req, res) => {
    const {id} = req.params;
    const newlyUpdatedData = req.body;

    // listing update
    const listingResult = await carListingCollection.updateOne(
        {_id: new ObjectId(id)},
        {$set: newlyUpdatedData}
    );

    const listing = await carListingCollection.findOne({_id: new ObjectId(id)});
    const exploreId = listing?.exploreId;

    if(exploreId) {
        await carCollection.updateOne(
            {_id: new ObjectId(exploreId)},
            {$set: newlyUpdatedData}
        );
    }

    res.json(listingResult);
})

    // app.patch("/listing/:id", async(req, res)=>{
    //   const {id} = req.params;
    //   const newlyUpdatedData = req.body;
    //   const result = await carListingCollection.updateOne(
    //     {_id: new ObjectId(id)},
    //     {$set: newlyUpdatedData}
    //   )
    //   res.json(result);
    // })


    // admin endpoints
    app.get("/admin/users", authenticate, requireAdmin, async (req, res) => {
      const users = await userCollection.find({}, {
        projection: { password: 0 }
      }).toArray();
      res.json(users);
    });

    app.patch("/admin/users/:id/role", authenticate, requireAdmin, async (req, res) => {
      const { id } = req.params;
      const { role } = req.body;
      if (!["customer", "admin"].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }
      await userCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { role } }
      );
      res.json({ message: "Role updated successfully" });
    });

    app.get("/admin/bookings", authenticate, requireAdmin, async (req, res) => {
      const bookings = await carBookingCollection.find().toArray();
      res.json(bookings);
    });

    // search & filter
    
    
    
  app.get("/explore", async (req, res) => {
  const { search, category } = req.query;
  let query = {};

  if (search) {
    query.$or = [
      { brand: { $regex: search, $options: "i" } },
      { model: { $regex: search, $options: "i" } },
    ];
  }

  if (category) {
    query.category = category;
  }

  const result = await carCollection.find(query).toArray();
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
