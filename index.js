const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());
// bloodDonation
// KgA4nzSuCpEFVOgs

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.pz6rkt0.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
console.log(process.env.DB_USER);
console.log(process.env.DB_PASS);
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
    // await client.connect();

    const userCollection = client.db("bloodDonation").collection("users");
    const reviewCollection = client.db("bloodDonation").collection("reviews");
    const fmcTokenCollection = client
      .db("bloodDonation")
      .collection("fmc-tokens");
    const availableDonorCollection = client
      .db("bloodDonation")
      .collection("available-donor");
    const userPostCollection = client
      .db("bloodDonation")
      .collection("allPosts");
    const userCommentCollection = client
      .db("bloodDonation")
      .collection("allComments");
    // User api
    // app.get("/users", async (req, res) => {
    //     // console.log(req.headers);
    //     const result = await userCollection.find().toArray();
    //     res.send(result)
    // })
    app.get("/users/:id", async (req, res) => {
      const id = req.params.id;
      // console.log("req.params 41", req.params);
      const query = { _id: new ObjectId(id) };
      result = await userCollection.findOne(query);
      res.send(result);
    });
    app.get("/users/email/:email", async (req, res) => {
      const email = req.params.email;
      console.log("req.params", req.params);

      const query = { user_email: email };
      try {
        const user = await userCollection.findOne(query);
        // console.log("53", user);
        if (user) {
          res.send(user);
        } else {
          res.status(404).send({ message: "User not found" });
        }
      } catch (error) {
        console.error("Error finding user by email:", error);
        res.status(500).send({ message: "Internal server error" });
      }
    });
    app.get("/users", async (req, res) => {
      const filter = req.query;
      console.log(filter);
      // Extract search and category from query parameters
      const { blood = "", religious = "", division = "" } = filter;
      // Construct query based on blood and category
      const query = {};
      if (blood) {
        query.bloodGroup = { $regex: new RegExp(blood, "i") };
      }
      if (religious && religious !== "All") {
        query.user_religious = { $regex: new RegExp(religious, "i") };
      }
      if (division && division !== "All") {
        query.product_division = { $regex: new RegExp(division, "i") };
      }
      try {
        // Find products based on the constructed query
        const result = await userCollection.find(query).toArray();
        res.send(result);
      } catch (error) {
        console.error("Error fetching products:", error);
        res.status(500).send("Internal server error");
      }
    });
    app.post("/users", async (req, res) => {
      const user = req.body;
      // console.log("body", user);
      const query = { email: user.user_email };
      const existingUser = await userCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: "user already exists on database" });
      }
      const result = await userCollection.insertOne(user);
      res.send(result);
    });
    app.put("/users/:id", async (req, res) => {
      const userInfo = req.body;
      const id = req.params.id;
      console.log("params", id);
      const query = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updatedInfo = {
        $set: {
          user_name: updatedInfo.user_name,
          user_age: updatedInfo.user_age,
          bloodGroup: updatedInfo.bloodGroup,
          phone_number: updatedInfo.phone_number,
          user_email: updatedInfo.user_email,
          user_whatsapp: updatedInfo.user_whatsapp,
          user_messenger: updatedInfo.user_messenger,
          user_address: updatedInfo.user_address,
          user_activeStatus: updatedInfo.user_activeStatus,
          user_maritalStatus: updatedInfo.user_maritalStatus,
          user_religious: updatedInfo.user_religious,
          // user_password: updatedInfo.user_password,
          user_image: updatedInfo.user_image,
          user_nationality: updatedInfo.user_nationality,
          last_updated_time: updatedInfo.last_updated_time,
        },
      };
      console.log("updated info", updatedItems);
      // const result = await addedProductCollection.updateOne(filter, { $set: { ...updatedItems } }, options)
      // const result = await addedProductCollection.updateOne(filter, updatedInfo, options)
      // res.send(result);
    });

    app.patch("/users/:id", async (req, res) => {
      const updatedStatus = req.body;
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      console.log("updatedStatus", updatedStatus);
      const updateProduct = {
        $set: {
          user_activeStatus: updatedStatus.status,
        },
      };
      // console.log("updateProduct", updateProduct);
      const result = await userCollection.updateOne(filter, updateProduct);
      console.log("result", result);
      res.send(result);
    });
    app.delete("/users", async (req, res) => {
      const result = await userCollection.deleteMany({});
      res.send(result);
    });
    app.get("/fmc-tokens", async (req, res) => {
      result = await fmcTokenCollection.find().toArray();
      res.send(result);
    });

    app.post("/fmc-tokens", async (req, res) => {
      const token = req.body;
      // console.log("body", token);
      const query = { email: token.fmcToken };
      const existingFMCToken = await fmcTokenCollection.findOne(query);
      if (existingFMCToken) {
        return res.send({
          message: "token already exists on database for this user.",
        });
      }
      const result = await fmcTokenCollection.insertOne(token);
      res.send(result);
    });

    // app.get("/available-donor", async (req, res) => {
    //     const result = await userCollection.find({ user_activeStatus: "active" }).toArray();
    //     res.send(result)
    // })
    app.get("/available-donor/:id", async (req, res) => {
      const id = req.params.id;
      // console.log("available-donor/:id",id);
      const query = { _id: new ObjectId(id) };
      result = await userCollection.findOne(query);
      res.send(result);
    });
    app.get("/available-donor", async (req, res) => {
      const filter = req.query;
      const {
        blood = "",
        religious = "",
        division = "",
        district = "",
        area = "",
      } = filter;
      console.log("filter from available donor", filter);
      // Construct query based on blood, religion, division, and active status
      const query = { user_activeStatus: "active" }; // Ensure only active users are returned
      console.log("query", query);
      // if (blood && blood !== "All") {
      //     query.bloodGroup = { $regex: new RegExp(blood, "i") };
      // }
      if (blood && blood !== "All") {
        query.bloodGroup = { $regex: new RegExp(`^${blood}$`, "i") }; // Ensure an exact match
      }
      if (religious && religious !== "All") {
        query.user_religious = { $regex: new RegExp(religious, "i") };
      }
      if (district && district !== "All") {
        query.user_district = { $regex: new RegExp(district, "i") };
      }
      if (area && area !== "All") {
        query.user_area = { $regex: new RegExp(area, "i") };
      }

      try {
        // Fetch users based on the constructed query
        const result = await userCollection.find(query).toArray();
        res.send(result);
      } catch (error) {
        console.error("Error fetching active users:", error);
        res.status(500).send("Internal server error");
      }
    });

    // app.put("/users/:id",(req,res)=>{
    // })

    // create post api->>
    app.get("/allPosts", async (req, res) => {
      const result = await userPostCollection.find().toArray();
      res.send(result);
    });
    app.post("/allPosts", async (req, res) => {
      const postInfo = req.body;
      console.log("postInfo", postInfo);
      const postCreatedDate = new Date(); // Save current date and time
      const newPost = { ...postInfo, postCreatedDate };
      const result = await userPostCollection.insertOne(newPost);
      res.send(result);
    });

    app.patch("/allPosts/:id", async (req, res) => {
      const updatedStatus = req.body;
      console.log(updatedStatus.status);
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      console.log("updatedStatus", updatedStatus);
      const updateProduct = {
        $set: {
          found_donor_successfully: updatedStatus.status,
        },
      };
      // console.log("updateProduct", updateProduct);
      const result = await userPostCollection.updateOne(filter, updateProduct);
      console.log("result", result);
      res.send(result);
    });

    // create allComments api->>

    app.get("/allComments", async (req, res) => {
      const result = await userCommentCollection.find().toArray();
      res.send(result);
    });
    app.post("/allComments", async (req, res) => {
      const postInfo = req.body;
      console.log("postInfo", postInfo);
      const postCreatedDate = new Date(); // Save current date and time
      const newPost = { ...postInfo, postCreatedDate };
      const result = await userCommentCollection.insertOne(newPost);
      res.send(result);
    });
    app.delete("/allComments", async (req, res) => {
      const result = await userCommentCollection.deleteMany({});
      res.send(result);
    });
    app;

    // allReviews api->>

    app.get("/reviews", async (req, res) => {
      const result = await reviewCollection.find().toArray();
      res.send(result);
    });
    app.post("/reviews", async (req, res) => {
      const postInfo = req.body;
      // console.log("postInfo", postInfo);
      const newPost = {
        ...postInfo,
        postCreatedDate: new Date(),
        update_history: [],
      };
      const result = await reviewCollection.insertOne(newPost);
      res.send(result);
    });
    app.patch("/reviews/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedReviewInfo = req.body;
      console.log("updatedReviewInfo", updatedReviewInfo);

      // Fetch the existing review
      const existingReview = await reviewCollection.findOne(filter);

      const updateReview = {
        $set: {
          // product_quantity: updatedReviewInfo.afterOrderQuantity,
          // product_totalSell: updatedReviewInfo.finalSell,
          rating: updatedReviewInfo.rating,
          review_content: updatedReviewInfo.review_content,
          update_status: updatedReviewInfo.update_status,
        },
        $push: {
          // Add the previous review to the history array
          update_history: {
            pre_rating: existingReview.rating,
            updated_rating: updatedReviewInfo.rating,
            pre_review_content: existingReview.review_content,
            updated_review_content: updatedReviewInfo.review_content,
            updated_review_time: new Date().toLocaleTimeString(), // Update time
            updated_review_date: new Date().toLocaleDateString(), // Update date
          },
        },
      };
      console.log("updateReview", updateReview);
      const result = await reviewCollection.updateOne(filter, updateReview);
      console.log("result", result);
      res.send(result);
    });

    app.delete("/reviews/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await reviewCollection.deleteOne(query);
      res.send(result);
    });
    app.delete("/reviews", async (req, res) => {
      const result = await reviewCollection.deleteMany({});
      res.send(result);
    });

    app.get("/single-post-details/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      // console.log("/single-post-details/:id", id);
      // console.log("/single-post-details/:id", query);
      const result = await userPostCollection.findOne(query);
      console.log(result);
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Blood Donation server is running..");
});

app.listen(port, () => {
  console.log(`Blood Donation server is running on port ${port}`);
});
