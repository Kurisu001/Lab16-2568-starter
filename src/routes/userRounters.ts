import { Router, type Request, type Response } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

import type { User, CustomRequest, UserPayload } from "../libs/types.js";

// import database
import { users, reset_users } from "../db/db.js";
import { success } from "zod";
import { zStudentId } from "../libs/zodValidators.js";
import { authenticateToken } from "../middlewares/authenMiddleware.js";
import { checkRoleAdmin } from "../middlewares/checkRoleAdminMiddleware.js";


const router = Router();

// GET /api/v2/users
router.get("/", authenticateToken , checkRoleAdmin , (req: Request, res: Response) => {
  try {
    // const authHeader = req.headers["authorization"]
    // console.log(authHeader)

    // //Check authHeader is not found or wrong format
    // if(!authHeader || authHeader.startsWith("Bearer ")){
    //     return res.status(401).json({
    //         success: false,
    //         message:"Authorization header is not found"
    //     })
    // }

    // const token = authHeader?.split("")[1];

    // //check is have token?
    // if(!token){
    //     return res.status(401).json({
    //         success: false,
    //         message:"Token is requried"
    //     })
    // }
    // try {
    //     const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY || "froget secret";
    //     jwt.verify(token,JWT_SECRET_KEY,(err,payload)=>{
    //         if(err){
    //             return res.status(402).json({
    //                 success:false,
    //                 message:"invalid of expired token"
    //             })
    //         }
    //         const user = users.find(
    //             (u:User) => u.username === (payload as UserPayload).username
    //         )

    //         if(!user || user.role != "ADMIN"){
    //             return res.status(404).json({
    //                 success:false,
    //                 message:"Unaturized user"
    //             })
    //         }
    //     })
    // } catch (err) {
    //     return res.status(500).json({
    //         success:false,
    //         message:"Something is wrong, please try again",
    //         error:err
    //     })
    // }
    //return all user for admin role
    return res.json({
      success: true,
      data: users,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Something is wrong, please try again",
      error: err
    });
  }
});

// POST /api/v2/users/login
router.post("/login", (req: Request, res: Response) => {
  try {
    // 1. get username and password from body
    const { username, password } = req.body;

    // 2. check if user exists (search with username & password in DB)
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Username and password are required",
      });
    }
    const user = users.find(
      (u) => u.username === username && u.password === password
    );
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password",
      });
    }

    // 3. create JWT token (with user info object as payload) using JWT_SECRET_KEY
    //    (optional: save the token as part of User data)
    const JWT_SECRET_KEY = process.env.JWT_SECRET || "forget_to_set_env_file";
    const token = jwt.sign(
      {
        // add JWT payload data
        username: user.username,
        studentId: user.studentId,
        role: user.role,
      },
      JWT_SECRET_KEY,
      { expiresIn: "30m" }
    );

    // 4. send HTTP response with JWT token

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Something is wrong, please try again",
      error: err,
    });
  }

  return res.status(500).json({
    success: false,
    message: "POST /api/v2/users/login has not been implemented yet",
  });
});

// POST /api/v2/users/logout
router.post("/logout", (req: Request, res: Response) => {
  // 1. check Request if "authorization" header exists
  //    and container "Bearer ...JWT-Token..."
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized: Header not found or invalid",
    });
  }

  // 2. extract the "...JWT-Token..." if available
  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Token not found",
    });
  }

  // 3. verify token using JWT_SECRET_KEY and get payload (username, studentId and role)
  const JWT_SECRET_KEY = process.env.JWT_SECRET || "forget_to_set_env_file";
  try {
    const payload = jwt.verify(token, JWT_SECRET_KEY) as UserPayload;

    // 4. check if user exists (search with username)
    const user = users.find((u) => u.username === payload.username);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    // 5. proceed with logout process and return HTTP response
    //    (optional: remove the token from User data)
    return res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  } catch (err) {
    return res.status(403).json({
      success: false,
      message: "Forbidden: Invalid or expired token",
      error: err,
    });
  }

  return res.status(500).json({
    success: false,
    message: "POST /api/v2/users/logout has not been implemented yet",
  });
});

// POST /api/v2/users/reset
router.post("/reset", (req: Request, res: Response) => {
  try {
    reset_users();
    return res.status(200).json({
      success: true,
      message: "User database has been reset",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Something is wrong, please try again",
      error: err,
    });
  }
});

export default router;