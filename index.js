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
    const reportDonorCollection = client
      .db("bloodDonation")
      .collection("reportDonor");
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
      console.log("filter from users", filter);
      // Extract search and category from query parameters
      const {
        search = "",
        blood = "",
        gender = "",
        accountStatus = "",
        availableStatus = "",
        religious = "",
        division = "",
      } = filter;
      // Construct query based on blood and category
      const query = {};
      // If a search query is provided, search in _id, phone, email, or user_name
      if (search) {
        query.$or = [
          { _id: { $regex: new RegExp(search, "i") } },
          { user_name: { $regex: new RegExp(search, "i") } },
          { user_email: { $regex: new RegExp(search, "i") } },
          { phone_number: { $regex: new RegExp(search, "i") } },
        ];
        // If the search term is a valid ObjectId, adjust the query
        if (ObjectId.isValid(search)) {
          query.$or.push({ _id: new ObjectId(search) });
        }
      }
      if (blood && blood !== "All") {
        query.bloodGroup = { $regex: new RegExp(blood, "i") };
      }
      if (religious && religious !== "All") {
        query.user_religious = { $regex: new RegExp(religious, "i") };
      }
      if (gender && gender !== "All") {
        query.user_gender = { $regex: new RegExp(gender, "i") };
      }
      if (accountStatus && accountStatus !== "All") {
        query.account_status = accountStatus === "activate" ? false : true;
        // query.account_status = accountStatus;
      }
      if (availableStatus && availableStatus !== "All") {
        query.user_activeStatus = availableStatus;
      }
      if (division && division !== "All") {
        query.product_division = { $regex: new RegExp(division, "i") };
      }
      try {
        // Find products based on the constructed query
        const result = await userCollection.find(query).toArray();
        res.send(result);
      } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).send("Internal server error");
      }
    });
    app.post("/users", async (req, res) => {
      const userInfo = req.body;
      const query = { user_email: userInfo.user_email };
      console.log("userInfo", userInfo);
      const existingUser = await userCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: "user already exists on database" });
      }
      const result = await userCollection.insertOne(userInfo);
      res.send(result);
    });
    app.post("/login", async (req, res) => {
      const { user_email, password } = req.body;

      const user = await userCollection.findOne({ user_email });

      if (!user) {
        return res.status(400).send({ message: "User not found!" });
      }

      if (user.account_status === true) {
        return res.status(403).send({
          message:
            "This account has been suspended. For more information, please contact support.",
        });
      }

      const isPasswordValid = password === user?.user_password;

      if (!isPasswordValid) {
        return res.status(401).send({ message: "Invalid password." });
      }

      res.status(200).send({ message: "Login successful", user });
    });

    // app.post("/users", async (req, res) => {
    //   const { user_email, password } = req.body;

    //   const user = await userCollection.findOne({ user_email: user_email });

    //   if (!user) {
    //     return res.status(400).send({ message: "User not found!" });
    //   }

    //   if (user.account_status === true) {
    //     return res.status(403).send({
    //       message:
    //         "This account has been suspended. For more information, please contact support.",
    //     });
    //   }
    //   const isPasswordValid = password === user?.user_password;

    //   if (!isPasswordValid) {
    //     return res.status(401).send({ message: "Invalid email or password." });
    //   }
    //   res.status(200).send({ message: "Login successful", user });
    // });
    app.put("/users/:id", async (req, res) => {
      const updatedInfo = req.body;
      const id = req.params.id;
      console.log("params", id);
      const query = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updatedItems = {
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
          user_gender: updatedInfo.user_gender,
          // user_password: updatedInfo.user_password,
          user_image: updatedInfo.user_image,
          user_nationality: updatedInfo.user_nationality,
          last_updated_time: updatedInfo.last_updated_time,
        },
      };
      console.log("updated info", updatedItems);
      // const result = await addedProductCollection.updateOne(filter, { $set: { ...updatedItems } }, options)
      const result = await userCollection.updateOne(
        query,
        updatedItems,
        options
      );
      res.send(result);
    });

    app.patch("/users/:id", async (req, res) => {
      const updatedStatus = req.body;
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      console.log("updated users Status", updatedStatus);
      const updateProduct = {
        $set: {
          user_activeStatus: updatedStatus.user_activeStatus,
          account_status: updatedStatus.account_status,
          showImage: updatedStatus.showImage,
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
        gender = "",
      } = filter;
      console.log("filter from available donor", filter);
      // Construct query based on blood, religion, division, and active status
      const query = { user_activeStatus: "active", account_status: false }; // Ensure only active users are returned
      // console.log("query", query);
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
      if (gender && gender !== "All") {
        query.user_gender = { $regex: new RegExp(gender, "i") };
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

    // create post api->>
    app.get("/allPosts", async (req, res) => {
      const result = await userPostCollection.find().toArray();
      res.send(result);
    });
    app.get("/allPosts/:id", async (req, res) => {
      const id = req.params.id;
      // console.log("req.params 41", req.params);
      const query = { _id: new ObjectId(id) };
      result = await userPostCollection.findOne(query);
      res.send(result);
    });
    app.post("/allPosts", async (req, res) => {
      const postInfo = req.body;
      // console.log("postInfo", postInfo);
      const postCreatedDate = new Date(); // Save current date and time
      const newPost = { ...postInfo, postCreatedDate };
      const result = await userPostCollection.insertOne(newPost);
      res.send(result);
    });
    // -------------need to modify--------
    // app.put("/allPosts/:id", async (req, res) => {
    //   try {
    //     const postId = req.params.id;
    //     console.log("Updating Post with ID:", postId);
    //     const updatedPostInfo = req.body;

    //     const query = { _id: new ObjectId(postId) };
    //     console.log("Updating Post query", query);

    //     const userId = updatedPostInfo.userId; // userId is those user id who send request for update the post
    //     // check that the requested user is authenticate or not
    //     const checkAuthenticateUser = await userCollection.findOne({
    //       _id: new ObjectId(String(userId)),
    //     });
    //     if (!checkAuthenticateUser) {
    //       return res.status(404).json({ error: "User not found" });
    //     }

    //     // Find the post by postId
    //     const post = await userPostCollection.findOne({
    //       _id: new ObjectId(postId),
    //     });
    //     console.log("Find the post by postId:", post);

    //     if (!post) {
    //       return res.status(404).json({ error: "Post not found" });
    //     }

    //     // Check if the requesting user is the creator of the post
    //     if (post.creator_id.toString() !== userId) {
    //       return res
    //         .status(403)
    //         .json({ error: "Unauthorized: You can't delete this post" });
    //     }
    //     // Ensure userId is not undefined
    //     if (!userId) {
    //       return res.status(400).json({ error: "User ID is required" });
    //     }
    //     // If authorized, delete the post

    //     const options = { upsert: true };
    //     const updatedContent = {
    //       $set: {
    //         creator_id: updatedPostInfo.creator_id,
    //         creator_name: updatedPostInfo.creator_name,
    //         creator_email: updatedPostInfo.creator_email,
    //         post_created_time: updatedPostInfo.post_created_time,
    //         post_created_date: updatedPostInfo.post_created_date,
    //         post_updated_time: updatedPostInfo.post_updated_time,
    //         post_updated_date: updatedPostInfo.post_updated_date,
    //         creator_image: updatedPostInfo.creator_image,
    //         post_deadline: updatedPostInfo.post_deadline,
    //         unit_of_blood: updatedPostInfo.unit_of_blood,
    //         post_images: updatedPostInfo.post_images,
    //         bloodGroup: updatedPostInfo.bloodGroup,
    //         relation_with_patient: updatedPostInfo.relation_with_patient,
    //         patient_name: updatedPostInfo.patient_name,
    //         patient_age: updatedPostInfo.patient_age,
    //         patient_gender: updatedPostInfo.patient_gender,
    //         patient_region: updatedPostInfo.patient_region,
    //         medical_reason: updatedPostInfo.medical_reason,
    //         primary_number: updatedPostInfo.primary_number,
    //         alternative_number: updatedPostInfo.alternative_number,
    //         hospital_location: updatedPostInfo.hospital_location,
    //         google_map_location: updatedPostInfo.google_map_location,
    //         district_name: updatedPostInfo.district_name,
    //         upazila_name: updatedPostInfo.upazila_name,
    //         found_donor_successfully: updatedPostInfo.found_donor_successfully,
    //       },
    //     };
    //     console.log("updated info", updatedContent);
    //     // const result = await userPostCollection.updateOne(
    //     //   query,
    //     //   updatedContent,
    //     //   options
    //     // );

    //     // if (result.modifiedCount > 0) {
    //     //   return res.status(200).json({ message: "Post Updated successfully" });
    //     // } else {
    //     //   return res.status(500).json({ error: "Failed to update post" });
    //     // }
    //   } catch (error) {
    //     console.error("Error updating post:", error);
    //     return res.status(500).json({ error: "Internal Server Error" });
    //   }
    // });

    app.put("/allPosts/:id", async (req, res) => {
      try {
        const postId = req.params.id;
        const updatedPostInfo = req.body;
        const filter = { _id: new ObjectId(postId) };
        const userId = updatedPostInfo.userId; // User requesting update

        console.log("Updating Post with ID:", postId);
        // const userId = { _id: new ObjectId(String(updatedPostInfo.userId)) };
        // console.log(userId);

        // ✅ Check if postId and userId are valid MongoDB ObjectIds
        if (!ObjectId.isValid(postId)) {
          console.log("Invalid Post ID");
          return res.status(400).json({ error: "Invalid Post ID" });
        }
        if (!ObjectId.isValid(userId)) {
          console.log("Invalid User ID");
          return res.status(400).json({ error: "Invalid User ID" });
        }

        // // ✅ Check if the user exists
        const checkAuthenticateUser = await userCollection.findOne({
          _id: new ObjectId(String(userId)),
        });
        console.log("checkAuthenticateUser", checkAuthenticateUser);
        if (!checkAuthenticateUser) {
          return res.status(404).json({ error: "User not found" });
        }

        // // ✅ Check if the post exists
        const post = await userPostCollection.findOne({
          _id: new ObjectId(postId),
        });
        console.log("Find the post by postId:", post);

        if (!post) {
          return res.status(404).json({ error: "Post not found" });
        }

        // // ✅ Ensure the user is the owner of the post
        if (post.creator_id.toString() !== userId) {
          console.log("Unauthorized: You can't update this post");
          return res
            .status(403)
            .json({ error: "Unauthorized: You can't update this post" });
        }

        const options = { upsert: false };
        const updatedContent = {
          $set: {
            creator_name: updatedPostInfo.creator_name,
            creator_email: updatedPostInfo.creator_email,
            post_updated_time: updatedPostInfo.post_updated_time,
            post_updated_date: updatedPostInfo.post_updated_date,
            post_deadline: updatedPostInfo.post_deadline,
            unit_of_blood: updatedPostInfo.unit_of_blood,
            bloodGroup: updatedPostInfo.bloodGroup,
            relation_with_patient: updatedPostInfo.relation_with_patient,
            patient_name: updatedPostInfo.patient_name,
            patient_age: updatedPostInfo.patient_age,
            patient_gender: updatedPostInfo.patient_gender,
            patient_region: updatedPostInfo.patient_region,
            medical_reason: updatedPostInfo.medical_reason,
            primary_number: updatedPostInfo.primary_number,
            alternative_number: updatedPostInfo.alternative_number,
            hospital_location: updatedPostInfo.hospital_location,
            google_map_location: updatedPostInfo.google_map_location,
            district_name: updatedPostInfo.district_name,
            upazila_name: updatedPostInfo.upazila_name,
            found_donor_successfully: updatedPostInfo.found_donor_successfully,
          },
        };

        console.log("Updated Info:", updatedContent);

        // ✅ Update the post
        const result = await userPostCollection.updateOne(
          filter,
          updatedContent,
          options
        );

        if (result.modifiedCount > 0) {
          return res.status(200).json({ message: "Post updated successfully" });
        } else {
          return res
            .status(400)
            .json({ error: "No changes detected or failed to update" });
        }
      } catch (error) {
        console.error("Error updating post:", error);
        return res.status(500).json({ error: "Internal Server Error" });
      }
    });

    // ---------------------

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
    app.delete("/allPosts/:id", async (req, res) => {
      const postId = req.params.id;
      const userId = req.body.userId;
      try {
        // Find the post by postId
        const post = await userPostCollection.findOne({
          _id: new ObjectId(postId),
        });

        if (!post) {
          return res.status(404).json({ error: "Post not found" });
        }

        // Check if the requesting user is the creator of the post
        if (post.creator_id.toString() !== userId) {
          return res
            .status(403)
            .json({ error: "Unauthorized: You can't delete this post" });
        }
        // Ensure userId is not undefined
        if (!userId) {
          return res.status(400).json({ error: "User ID is required" });
        }

        // If authorized, delete the post
        const result = await userPostCollection.deleteOne({
          _id: new ObjectId(postId),
        });

        if (result.deletedCount === 1) {
          return res.status(200).json({ message: "Post deleted successfully" });
        } else {
          return res.status(500).json({ error: "Failed to delete post" });
        }
      } catch (error) {
        console.error("Error deleting post:", error);
        return res.status(500).json({ error: "Internal server error" });
      }
    });

    // create allComments api->>

    app.get("/allComments", async (req, res) => {
      const result = await userCommentCollection.find().toArray();
      res.send(result);
    });
    app.post("/allComments", async (req, res) => {
      const postInfo = req.body;
      // console.log("postInfo", postInfo);
      const postCreatedDate = new Date(); // Save current date and time
      const newPost = { ...postInfo, postCreatedDate };
      const result = await userCommentCollection.insertOne(newPost);
      res.send(result);
    });
    app.delete("/allComments", async (req, res) => {
      const result = await userCommentCollection.deleteMany({});
      res.send(result);
    });

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
    // single-post-details api
    app.get("/single-post-details/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      // console.log("/single-post-details/:id", id);
      // console.log("/single-post-details/:id", query);
      const result = await userPostCollection.findOne(query);
      console.log(result);
      res.send(result);
    });

    // report info API
    app.get("/reportDonor", async (req, res) => {
      const result = await reportDonorCollection.find().toArray();
      res.send(result);
    });
    app.get("/myReports", async (req, res) => {
      const { reported_by } = req.query; // logged-in user's ID
      const reports = await reportDonorCollection
        .find({ reported_by })
        .toArray();
      res.send(reports);
    });
    // Create a route to check if the user has already reported the donor
    app.get("/hasReported", async (req, res) => {
      const { reported_by, reported_to } = req.query;
      const existingReport = await reportDonorCollection.findOne({
        reported_by,
        reported_to,
      });

      if (existingReport) {
        return res.status(200).send({ reported: true });
      } else {
        return res.status(200).send({ reported: false });
      }
    });

    app.post("/reportDonor", async (req, res) => {
      const reportInfo = req.body;
      const newPost = {
        ...reportInfo,
        reportDate: new Date(),
      };
      const result = await reportDonorCollection.insertOne(newPost);
      res.send(result);
    });

    app.patch("/reportDonor/:id", async (req, res) => {
      const updatedStatus = req.body;
      console.log(updatedStatus.status);
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      console.log("updatedStatus", updatedStatus);
      const updateReport = {
        $set: {
          // report_status: updatedStatus.status,
          report_status: true,
        },
      };
      // console.log("updateReport", updateReport);
      const result = await reportDonorCollection.updateOne(
        filter,
        updateReport
      );
      console.log("result", result);
      res.send(result);
    });

    app.delete("/reportDonor", async (req, res) => {
      const result = await reportDonorCollection.deleteMany({});
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
