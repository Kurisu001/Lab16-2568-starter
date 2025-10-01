import { Router, type NextFunction, type Request, type Response } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

import {users} from "../db/db.js"
import { type UserPayload,type User } from "../libs/types.js";



export const authenticateToken = (
    req:Request,
    res:Response,
    next:NextFunction
)=>{

    const authHeader = req.headers["authorization"]
    //console.log(authHeader)

    //Check authHeader is not found or wrong format
    if(!authHeader || !authHeader.startsWith("Bearer ")){
        return res.status(401).json({
            success: false,
            message:"Authorization header is not found"
        })
    }

    const token = authHeader?.split(" ")[1];
    //check is have token?
    if(!token){
        return res.status(401).json({
            success: false,
            message:"Token is requried"
        })
    }
    try {
        const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY || "froget secret";
        jwt.verify(token,JWT_SECRET_KEY,(err,payload)=>{
            if(err){
                return res.status(402).json({
                    success:false,
                    message:"invalid of expired token"
                })
            }
            res.locals.pay = payload
        })
    } catch (err) {
        return res.status(500).json({
            success:false,
            message:"Something is wrong, please try again",
            error:err
        })
    }
    next();
}
