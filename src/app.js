import express from "express";
import cors from "cors";

import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";

const app = express();

app.use(cors());

app.use(express.json());

// app.use((req, res, next) => {
//     console.log("===== Incoming Request =====");

//     console.log("Method:", req.method);
//     console.log("URL:", req.originalUrl);

//     console.log("Body:", req.body);

//     console.log("Query:", req.query);

//     console.log("Params:", req.params);

//     console.log("============================");

//     next();
// });


app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);

// https://mern-backend-50wp.onrender.com

app.get("/", (req, res) => {
    res.send("<h1>This is my first API</h1>");
});




export default app;