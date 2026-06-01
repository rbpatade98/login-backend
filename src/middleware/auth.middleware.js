import jwt from "jsonwebtoken";
import Blacklist from "../models/blacklist.model.js";

export const verifyToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ success: false, message: "No token provided" });
        }

        const token = authHeader.split(" ")[1];

        // Check if token is blacklisted
        const checkIfBlacklisted = await Blacklist.findOne({ token });
        if (checkIfBlacklisted) {
            return res.status(401).json({ success: false, message: "Token is invalid (logged out)" });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        req.token = token;

        next();
    } catch (error) {
        console.log("Token Verification Error:", error);
        return res.status(401).json({ success: false, message: "Unauthorized or token expired" });
    }
};

export const isAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== "admin") {
        return res.status(403).json({ success: false, message: "Forbidden: Admin access required" });
    }
    next();
};
