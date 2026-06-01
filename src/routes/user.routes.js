import express from "express";

import {getAllUsers} from "../controllers/user.controller.js";
import { verifyToken, isAdmin } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", verifyToken, isAdmin, getAllUsers);

export default router;