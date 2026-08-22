require("dotenv").config();

const dns = require("dns");
dns.setDefaultResultOrder("ipv4first");
const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const multer = require("multer");
const path = require("path");
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static("uploads"));
app.use(express.static("public"));

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});


//Multer setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });






// 🔹 OTP Store (temporary)
const otpStore = {};

// 🔹 Email Transporter
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  family: 4,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// ----------------------
// Test route
// ----------------------
app.get("/", (req, res) => {
  res.send("Server is working");
});


// ======================
// 👨‍🎓 JUNIOR REGISTER
// ======================
app.post("/junior/register", async (req, res) => {
  try {
    const { name, userid, email, department, year, domain, password } = req.body;

    if (!name || !userid || !email || !department || !year || !domain || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await pool.query(
      "SELECT * FROM juniors WHERE email=$1",
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query(
      "INSERT INTO juniors (name, userid, email, department, year, domain, password) VALUES ($1,$2,$3,$4,$5,$6,$7)",
      [name, userid, email, department, year, domain, hashedPassword]
    );

    res.json({ message: "User registered successfully" });

  } catch (err) {
    console.error("Register Error:", err.message);
    res.status(500).json({ error: "Database error" });
  }
});


// ======================
// 👨‍🎓 JUNIOR LOGIN
// ======================
app.post("/junior/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check input
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    // Find user
    const result = await pool.query(
      "SELECT * FROM juniors WHERE email=$1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const user = result.rows[0];

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Success
    res.status(200).json({
  message: "Login successful",
  juniorId: user.id,
  name: user.name
});

  } catch (err) {
    console.error("Junior Login Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


// ======================
// 👨‍💼 SENIOR REGISTER
// ======================
app.post("/senior/register", async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      name,
      email,
      password,
      confirmPassword,
      type,
      domain,
      branch,
      company,
      role,
      skills
    } = req.body;

    // 🔥 Validation
    if (!name || !email || !password || !confirmPassword || 
        !type || !domain || !branch || !company || !role || !skills) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    const existing = await client.query(
      "SELECT * FROM seniors WHERE email=$1",
      [email]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await client.query("BEGIN");

    // 🔥 Insert into seniors
    const result = await client.query(
      `INSERT INTO seniors (name, email, password, domain, branch)
       VALUES ($1,$2,$3,$4,$5)
       RETURNING id`,
      [name, email, hashedPassword, domain, branch]
    );

    const seniorId = result.rows[0].id;

    // 🔥 Insert into senior_details
    await client.query(
      `INSERT INTO senior_details 
       (senior_id, type, company, role, skills) 
       VALUES ($1,$2,$3,$4,$5)`,
      [seniorId, type, company, role, skills]
    );

    await client.query("COMMIT");

    // ✅ 🔥 IMPORTANT FIX: SEND seniorId
    res.json({ 
      message: "Senior registered successfully",
      seniorId: seniorId
    });

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Senior Register Error:", err.message);
    res.status(500).json({ error: "Database error" });

  } finally {
    client.release();
  }
});



// ======================
// 👨‍💼 SENIOR LOGIN
// ======================
app.post("/senior/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await pool.query(
      "SELECT * FROM seniors WHERE email=$1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const senior = result.rows[0];

    const isMatch = await bcrypt.compare(password, senior.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // ✅ Return ID (already correct)
    res.json({ 
      message: "Senior login successful",
      seniorId: senior.id,
      name: senior.name
    });

  } catch (err) {
    console.error("Senior Login Error:", err.message);
    res.status(500).json({ error: "Database error" });
  }
});


// ======================
// 🔐 SEND OTP (COMMON)
// ======================
app.post("/send-otp", async (req, res) => {
  try {
    const { email } = req.body;

    const result = await pool.query(
      "SELECT email FROM juniors WHERE email=$1 UNION SELECT email FROM seniors WHERE email=$1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Email not registered" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000);

    otpStore[email] = {
      otp,
      expires: Date.now() + 5 * 60 * 1000
    };

    await transporter.sendMail({
      from: "placementguide7@gmail.com",
      to: email,
      subject: "Password Reset OTP",
      text: `Your OTP is: ${otp}`
    });

    res.json({ message: "OTP sent to your email" });

  } catch (err) {
    console.error("Send OTP Error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});


// ======================
// 🔐 VERIFY OTP
// ======================
app.post("/verify-otp", (req, res) => {
  const { email, otp } = req.body;

  if (!otpStore[email]) {
    return res.status(400).json({ message: "OTP not requested" });
  }

  const stored = otpStore[email];

  if (Date.now() > stored.expires) {
    delete otpStore[email];
    return res.status(400).json({ message: "OTP expired" });
  }

  if (parseInt(otp) !== stored.otp) {
    return res.status(400).json({ message: "Invalid OTP" });
  }

  res.json({ message: "OTP verified successfully" });
});


// ======================
// 🔐 RESET PASSWORD
// ======================
app.post("/reset-password", async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    // Validate input
    if (!email || !newPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if user exists
    const junior = await pool.query(
      "SELECT * FROM juniors WHERE email=$1",
      [email]
    );

    const senior = await pool.query(
      "SELECT * FROM seniors WHERE email=$1",
      [email]
    );

    if (junior.rows.length === 0 && senior.rows.length === 0) {
      return res.status(404).json({ message: "Email not registered" });
    }

    // 🔥 Hash password (IMPORTANT)
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update junior
    if (junior.rows.length > 0) {
      await pool.query(
        "UPDATE juniors SET password=$1 WHERE email=$2",
        [hashedPassword, email]
      );
    }

    // Update senior
    if (senior.rows.length > 0) {
      await pool.query(
        "UPDATE seniors SET password=$1 WHERE email=$2",
        [hashedPassword, email]
      );
    }

    // Optional: clear OTP
    if (otpStore[email]) {
      delete otpStore[email];
    }

    res.status(200).json({
      message: "Password updated successfully"
    });

  } catch (err) {
    console.error("Reset Password Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});




//profile pic ***********
app.post("/profile_pic", upload.single("profilePic"), async (req, res) => {
  try {
    // 🔥 Convert to integer safely
    const senior_id = parseInt(req.body.senior_id);

    // 🚨 Validate properly
    if (!senior_id || isNaN(senior_id)) {
      return res.status(400).json({ message: "Invalid or missing senior_id" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const filePath = `/uploads/${req.file.filename}`;

    await pool.query(
      "UPDATE seniors SET profile_pic = $1 WHERE id = $2",
      [filePath, senior_id]
    );

    res.json({
      message: "Profile picture uploaded successfully",
      filePath
    });

  } catch (err) {
    console.error("❌ Upload error:", err);
    res.status(500).json({ error: "Error uploading profile picture" });
  }
});



// ===============================
// PROFILE DETAILS
// ===============================
app.post("/profile_details", async (req, res) => {

    try {

        const {

            senior_id,
            skills,
            experience,
            resources,
            linkedin,
            github

        } = req.body;

        if (!senior_id) {

            return res.status(400).json({

                success: false,
                message: "Senior ID Missing"

            });

        }

        const cleanSeniorId = parseInt(senior_id);

        const existing = await pool.query(

            "SELECT * FROM senior_details WHERE senior_id=$1",

            [cleanSeniorId]

        );

        if (existing.rows.length > 0) {

            await pool.query(

                `UPDATE senior_details
                 SET
                    skills=$1,
                    experience=$2,
                    resources=$3,
                    linkedin=$4,
                    github=$5
                 WHERE senior_id=$6`,

                [

                    skills || null,
                    experience || null,
                    resources || null,
                    linkedin || null,
                    github || null,
                    cleanSeniorId

                ]

            );

        }

        else {

            await pool.query(

                `INSERT INTO senior_details
                (
                    senior_id,
                    skills,
                    experience,
                    resources,
                    linkedin,
                    github
                )
                VALUES
                (
                    $1,$2,$3,$4,$5,$6
                )`,

                [

                    cleanSeniorId,
                    skills || null,
                    experience || null,
                    resources || null,
                    linkedin || null,
                    github || null

                ]

            );

        }

        res.json({

            success: true,
            message: "Profile Saved Successfully"

        });

    }

    catch (err) {

        console.error(err);

        res.status(500).json({

            success: false,
            message: "Server Error"

        });

    }

});



// ======================
// 👨‍💼 GET ALL MENTORS
// ======================
app.get("/mentors", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        s.id,
        s.name,
        s.branch,
        s.domain,
        s.profile_pic,
        d.company
      FROM seniors s
      LEFT JOIN senior_details d
      ON s.id = d.senior_id
      ORDER BY s.id DESC
    `);

    res.json(result.rows);

  } catch (err) {
    console.error("Error fetching mentors:", err.message);
    res.status(500).json({ error: "Error fetching mentors" });
  }
});



// ======================
// 👨‍💼 GET SENIOR PROFILE
// ======================
app.get("/senior-profile/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT 
        s.id,
        s.name,
        s.email,
        s.domain,
        s.branch,
        s.profile_pic,

        d.type,
        d.company,
        d.role,
        d.skills,
        d.experience,
        d.resources,
        d.linkedin,
        d.github,
        d.major_skill

      FROM seniors s
      LEFT JOIN senior_details d 
      ON s.id = d.senior_id

      WHERE s.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Profile not found" });
    }

    const profile = result.rows[0];

    const baseUrl = "https://placement-app-58d1.onrender.com";

    // ✅ FIXED MAPPING
    const formattedProfile = {
      id: profile.id,
      name: profile.name,
      email: profile.email,
      domain: profile.domain,
      branch: profile.branch,

      // 🔥 FIXED (profile_pic)
      profilepic: profile.profile_pic
        ? `${baseUrl}/${profile.profile_pic}`
        : null,

      type: profile.type,
      company: profile.company,
      role: profile.role,

      // 🔥 FIXED (skills, resources)
      skills: profile.skills || "",
      major_skill: profile.major_skill || "",
      experience: profile.experience || "",
      resource: profile.resources || "",

      linkedin: profile.linkedin,
      github: profile.github,

     
    };

    res.json(formattedProfile);

  } catch (err) {
    console.error("Profile Fetch Error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});




// ======================
// 👨‍💼 GET SENIOR PROFILE
// ======================
app.get("/senior-profile/:id", async (req, res) => {

    try {

        const { id } = req.params;

        const result = await pool.query(

            `SELECT
                s.id,
                s.name,
                s.email,
                s.domain,
                s.branch,
                s.profile_pic,

                d.type,
                d.company,
                d.role,
                d.skills,
                d.experience,
                d.resources,
                d.linkedin,
                d.github,
                d.major_skill

            FROM seniors s

            LEFT JOIN senior_details d
            ON s.id = d.senior_id

            WHERE s.id = $1`,

            [id]

        );

        if (result.rows.length === 0) {

            return res.status(404).json({

                message: "Profile not found"

            });

        }

        const p = result.rows[0];

        const baseUrl = "https://placement-app-58d1.onrender.com";

        res.json({

            id: p.id,

            name: p.name,

            email: p.email,

            domain: p.domain,

            branch: p.branch,

            profilepic: p.profile_pic
                ? `${baseUrl}/${p.profile_pic}`
                : null,

            type: p.type || "",

            company: p.company || "",

            role: p.role || "",

            skills: p.skills || "",

            experience: p.experience || "",

            resources: p.resources || "",

            linkedin: p.linkedin || "",

            github: p.github || "",

            major_skill: p.major_skill || ""

        });

    }

    catch (err) {

        console.error(err);

        res.status(500).json({

            message: "Server Error"

        });

    }

});


// ----------------------
// Start server
// ----------------------
const http = require("http");
const { Server } = require("socket.io");

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

// FOR SOCKET
io.on("connection", (socket) => {

  

  socket.on("joinConversation", (conversationId) => {

    socket.join(`conversation_${conversationId}`);

    
    

  });

  socket.on("sendMessage", (data) => {

    io.to(
      `conversation_${data.conversationId}`
    ).emit(
      "receiveMessage",
      data
    );

  });

  socket.on("disconnect", () => {

    
  });

});

 
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

//create Community posts 
app.post("/community/post", async (req, res) => {
  try {

    const {
      user_id,
      user_name,
      user_type,
      title,
      description
    } = req.body;

    const result = await pool.query(
      `INSERT INTO community_posts
      (user_id, user_name, user_type, title, description)
      VALUES ($1,$2,$3,$4,$5)
      RETURNING *`,
      [
        user_id,
        user_name,
        user_type,
        title,
        description
      ]
    );

    res.status(201).json(result.rows[0]);

  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Failed to create post"
    });
  }
});

//******GET ALL POSTS ********
app.get("/community/posts", async (req, res) => {
  try {

    const result = await pool.query(
      `
      SELECT *
      FROM community_posts
      ORDER BY created_at DESC
      `
    );

    res.json(result.rows);

  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: "Failed to fetch posts"
    });
  }
});

//****gET ONE DISCUSIION ****** */
app.get("/community/post/:id", async (req, res) => {
  try {

    const { id } = req.params;

    const result = await pool.query(
      `
      SELECT *
      FROM community_posts
      WHERE id=$1
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Post not found"
      });
    }

    res.json(result.rows[0]);

  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: "Server error"
    });
  }
});

//**** ADD REPLY ****
app.post("/community/reply", async (req, res) => {
  try {

    const {
      post_id,
      user_id,
      user_name,
      user_type,
      reply
    } = req.body;

    // 1. Save reply
    const result = await pool.query(
      `
      INSERT INTO community_replies
      (
        post_id,
        user_id,
        user_name,
        user_type,
        reply
      )
      VALUES ($1,$2,$3,$4,$5)
      RETURNING *
      `,
      [
        post_id,
        user_id,
        user_name,
        user_type,
        reply
      ]
    );

    // 2. Find who created the post
    const postResult = await pool.query(
      `
      SELECT user_id, title
      FROM community_posts
      WHERE id = $1
      `,
      [post_id]
    );

    // 3. Get post owner details
    const postOwnerId = postResult.rows[0].user_id;
    const postTitle = postResult.rows[0].title;

    // 4. Don't notify if user replies to their own post
    if (postOwnerId != user_id) {

      await pool.query(
        `
        INSERT INTO notifications
        (user_id, message)
        VALUES ($1, $2)
        `,
        [
          postOwnerId,
          `${user_name} replied to your discussion "${postTitle}"`
        ]
      );

    }

    // 5. Send response
    res.status(201).json(result.rows[0]);

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: "Failed to add reply"
    });

  }
});


//**** GET REPLIES FOR  A POST  */
app.get("/community/replies/:postId", async (req, res) => {
  try {

    const { postId } = req.params;

    const result = await pool.query(
      `
      SELECT *
      FROM community_replies
      WHERE post_id=$1
      ORDER BY created_at ASC
      `,
      [postId]
    );

    res.json(result.rows);

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: "Failed to fetch replies"
    });
  }
});


//****** NOTIFICATIONS ***** */
app.get("/notifications/:userId", async (req, res) => {
  try {

    const { userId } = req.params;

    const result = await pool.query(
      `
      SELECT *
      FROM notifications
      WHERE user_id = $1
      ORDER BY created_at DESC
      `,
      [userId]
    );

    res.json(result.rows);

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: "Failed to fetch notifications"
    });

  }
});

//**** CREATE OR GET CONVERSATION ****
app.post("/chat/conversation", async (req, res) => {
  try {

    const { juniorId, seniorId } = req.body;

    // Check if conversation already exists

    const existing = await pool.query(
      `
      SELECT *
      FROM conversations
      WHERE junior_id = $1
      AND senior_id = $2
      `,
      [juniorId, seniorId]
    );

    if (existing.rows.length > 0) {

      return res.json({
        conversationId: existing.rows[0].id
      });

    }

    // Create new conversation

    const result = await pool.query(
      `
      INSERT INTO conversations
      (junior_id, senior_id)
      VALUES ($1, $2)
      RETURNING *
      `,
      [juniorId, seniorId]
    );

    res.json({
      conversationId: result.rows[0].id
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: "Failed to create conversation"
    });

  }
});

//**** SEND MESSAGE ****
app.post("/chat/send", async (req, res) => {
  try {

    const {
      conversationId,
      senderId,
      senderType,
      message
    } = req.body;

    const result = await pool.query(
      `
      INSERT INTO messages
      (
        conversation_id,
        sender_id,
        sender_type,
        message
      )
      VALUES ($1,$2,$3,$4)
      RETURNING *
      `,
      [
        conversationId,
        senderId,
        senderType,
        message
      ]
    );

    res.status(201).json(result.rows[0]);

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: "Failed to send message"
    });

  }
});

//**** GET ALL MESSAGES OF A CONVERSATION ****
app.get("/chat/messages/:conversationId", async (req, res) => {
  try {

    const { conversationId } = req.params;

    const result = await pool.query(
      `
      SELECT *
      FROM messages
      WHERE conversation_id = $1
      ORDER BY created_at ASC
      `,
      [conversationId]
    );

    res.json(result.rows);

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: "Failed to fetch messages"
    });

  }
});

//**** SENIOR INBOX ****
app.get("/chat/inbox/:seniorId", async (req, res) => {
  try {

    const { seniorId } = req.params;

    const result = await pool.query(
      `
      SELECT
        c.id AS conversation_id,
        j.id AS junior_id,
        j.name AS junior_name
      FROM conversations c
      JOIN juniors j
      ON c.junior_id = j.id
      WHERE c.senior_id = $1
      ORDER BY c.created_at DESC
      `,
      [seniorId]
    );

    res.json(result.rows);

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: "Failed to fetch inbox"
    });

  }
});

//**** GET SENIOR DETAILS ****
app.get("/chat/senior/:id", async (req, res) => {
  try {

    const { id } = req.params;

    const result = await pool.query(
      `
      SELECT id, name
      FROM seniors
      WHERE id = $1
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Senior not found"
      });
    }

    res.json(result.rows[0]);

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: "Server error"
    });

  }
});

app.get("/chat/junior/:id", async (req,res)=>{

  try{

    const { id } = req.params;

    const result = await pool.query(
      `
      SELECT id,name
      FROM juniors
      WHERE id=$1
      `,
      [id]
    );

    if(result.rows.length===0){
      return res.status(404).json({
        error:"Junior not found"
      });
    }

    res.json(result.rows[0]);

  }
  catch(err){

    console.error(err);

    res.status(500).json({
      error:"Server error"
    });

  }

});


//**********SETTINGS UPDATE */
app.get("/senior/profile/:id", async (req, res) => {

  try {

    const seniorId = req.params.id;

    const result = await pool.query(
      `
      SELECT
      s.id,
      s.name,
      s.email,
      s.domain,
      s.branch,
      s.profile_pic,

      d.type,
      d.company,
      d.role,
      d.skills,
      d.experience,
      d.resources,
      d.linkedin,
      d.github,
      d.major_skill

      FROM seniors s

      LEFT JOIN senior_details d
      ON s.id = d.senior_id

      WHERE s.id = $1
      `,
      [seniorId]
    );

    res.json(result.rows[0]);

  } catch (err) {

    console.error(err);

    res.status(500).json({
      message: "Error loading profile"
    });

  }

});


app.put("/senior/profile/:id", async (req, res) => {

  try {

    const seniorId = req.params.id;

    const {
      name,
      domain,
      branch,
      type,
      company,
      role,
      skills,
      experience,
      resources,
      linkedin,
      github,
      major_skill
    } = req.body;

    // Update seniors table
    await pool.query(
      `
      UPDATE seniors
      SET
        name = $1,
        domain = $2,
        branch = $3
      WHERE id = $4
      `,
      [
        name,
        domain,
        branch,
        seniorId
      ]
    );

    // Update senior_details table
    await pool.query(
      `
      UPDATE senior_details
      SET
        type = $1,
        company = $2,
        role = $3,
        skills = $4,
        experience = $5,
        resources = $6,
        linkedin = $7,
        github = $8,
        major_skill = $10
      WHERE senior_id = $11
      `,
      [
        type,
        company,
        role,
        skills,
        experience,
        resources,
        linkedin,
        github,
        major_skill,
        seniorId
      ]
    );

    res.json({
      message: "Profile updated successfully"
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      message: "Error updating profile"
    });

  }

});

//***********Used to update any updates  */
app.post("/updates", async (req, res) => {

    try {

        const { seniorId, content } = req.body;

        await pool.query(
            `
            INSERT INTO updates
            (senior_id, content)
            VALUES ($1, $2)
            `,
            [seniorId, content]
        );

        res.json({
            message: "Update posted"
        });

    } catch(err) {

        console.error(err);

        res.status(500).json({
            message: "Failed to post update"
        });

    }

});

app.get("/updates", async (req,res)=>{

    try{

        const result = await pool.query(
            `
            SELECT
            u.id,
            u.content,
            u.created_at,
            s.name

            FROM updates u

            JOIN seniors s
            ON u.senior_id = s.id

            ORDER BY u.created_at DESC
            `
        );

        res.json(result.rows);

    }
    catch(err){

        console.error(err);

        res.status(500).json({
            message:"Error loading updates"
        });

    }

});


//***********Notifications********// */
app.get(
  "/notifications",
  async (req, res) => {

    try {

      const posts =
      await pool.query(`
        SELECT
          id,
          'post' AS type,
          title AS content,
          created_at,
          id AS post_id
        FROM community_posts
      `);

      const replies =
      await pool.query(`
        SELECT
          id,
          'reply' AS type,
          CONCAT(
            user_name,
            ' replied to a discussion'
          ) AS content,
          created_at,
          post_id
        FROM community_replies
      `);

      const activities = [

        ...posts.rows,

        ...replies.rows

      ];

      activities.sort(
        (a, b) =>
          new Date(b.created_at) -
          new Date(a.created_at)
      );

      res.json(
        activities.slice(0, 10)
      );

    } catch (err) {

      console.error(
        "Error fetching notifications:",
        err
      );

      res.status(500).json({
        error:
        "Failed to fetch notifications"
      });

    }

  }
);