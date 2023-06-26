const express = require('express');
const cors = require('cors');
const app = express();
const jwt = require('jsonwebtoken');
const port = process.env.PORT || 5000;
// middleware
app.use(cors())
app.use(express.json());
require('dotenv').config()
const stripe = require("stripe")(process.env.PAYMENT_KEY);
// vaarify jwt function
const verifyJWT =(req,res,next)=>{
  const authorization =req.headers.authorization;
  if (!authorization) {
    return res.status(401).send({error:true, message:'Unauthorized access'})
  }
  // bearer token
  const token =authorization.split(' ')[1];
  jwt.verify(token,process.env.ACCESS_TOKEN, (err,decoded)=>{
    if (err) {
      return res.status(401).send({error:true, message:'Unauthorized access'})
    }
    req.decoded=decoded;
    next()
  })
}


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.pjt1xjf.mongodb.net/?retryWrites=true&w=majority`;


// Create a MongoClient with a MongoClientOptions object to set the Stable API version
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
    const menuCollection = client.db("bistroBoss").collection("menu");
    const reviewCollection = client.db("bistroBoss").collection("review");
    const cartCollection = client.db("bistroBoss").collection("cart");
    const userCollection = client.db("bistroBoss").collection("user");

      // JWT apis starts 
      app.post('/jwt', (req,res)=>{
        const user =req.body;
        const token =jwt.sign(user,process.env.ACCESS_TOKEN,{
          expiresIn:'1h'
        })
        res.send({token});
      })
      const verifyAdmin=async(req,res,next)=>{
        const email =req.decoded.email;
        const query={email:email};
        const single =await userCollection.findOne(query)
        if (single?.role !=='admin') {
          return res.status(401).send({error:true, message:'Unauthorized access'})
        }
        next()
      }
    // user related api
    app.post('/user',async(req,res)=>{
      const user =req.body;
      const query={email:user.email}
      const existingUser =await userCollection.findOne(query);
      if (existingUser) {
        return res.send({message:'User already exists'})
      }
      const result =await userCollection.insertOne(user)
      res.send(result)
    })
     // security layer: verifyJWT
    // email same
    // check admin
    app.get('/user/admin/:email', verifyJWT, async (req, res) => {
      const email = req.params.email;

      if (req.decoded.email !== email) {
        res.send({ admin: false })
      }
      const query = { email: email }
      const single = await userCollection.findOne(query);
      const result = { admin: single?.role === 'admin' }
      res.send(result);
    })
     
    app.patch('/user/admin/:id',async(req,res)=>{
      const id =req.params.id;
      const filter ={_id: new ObjectId(id)}
      const updateDoc = {
        $set: {
          role:'admin' 
        },
      };
      const result = await userCollection.updateOne(filter, updateDoc);
      res.send(result)
    })

    app.get('/user',verifyJWT,verifyAdmin, async(req,res)=>{    
      const result= await userCollection.find().toArray();
      res.send(result)
    })

  
  

// menu api
    app.get("/menu", async (req, res) => {
      const cursor = menuCollection.find()
      const result = await cursor.toArray()
      res.send(result)
    })

    app.post("/menu",verifyJWT,verifyAdmin,async(req,res)=>{
      const items =req.body;
      const result =await menuCollection.insertOne(items)
      res.send(result)
    })

// review apis
    app.get("/review", async (req, res) => {
      const cursor = reviewCollection.find()
      const result = await cursor.toArray()
      res.send(result)
    })


    // added cart related apis
    app.get("/cart",verifyJWT, async (req, res) => {
      const email =req.query.email;
      if(!email){
        res.send([])
      }
      const decodedEmail =req.decoded.email;
      if (email !==decodedEmail) {
        return res.status(401).send({error:true, message:'Unauthorized access'})
      }
      const query ={email:email}
      const result= await cartCollection.find(query).toArray();
      res.send(result)
      
    })

    app.post('/cart',async(req,res)=>{
      const items =req.body;
      const result =await cartCollection.insertOne(items)
      res.send(result)
    })
    app.delete('/cart/:id',async(req,res)=>{
      const id =req.params.id;
      const query={_id: new ObjectId(id)}
      const result=await cartCollection.deleteOne(query)
      res.send(result)
    })

    // stripe payment
    app.post("/create-payment-intent",verifyJWT, async (req, res) => {
      const { price } = req.body;
      const amount=price*100;
      // Create a PaymentIntent with the order amount and currency
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "usd",
        payment_method_types: ['card']
      });
    
      res.send({
        clientSecret: paymentIntent.client_secret
      });
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);










app.get('/', (req, res) => {
  res.send('Boss is running')
})
app.listen(port, () => {
  console.log(`Boss is running on port ${port}`);
})