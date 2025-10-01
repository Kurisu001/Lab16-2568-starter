import {users} from "../db/db.js"
import { Router, type NextFunction, type Request, type Response } from "express";
import type { CustomRequest, User } from "../libs/types.js";



export const checkRoleAdmin = (
    req:CustomRequest,
    res:Response,
    next: NextFunction

) =>{
    //get user payload and token from (custom ) request
    const payload = res.locals.pay // send object by res.local
    const token = req.token

    //console.log(payload)

    const user = users.find((user)=>{
        return user?.username === payload?.username
    })

    console.log(user)

    if(!user || user.role !== "ADMIN"){
        return res.status(404).json({
            success:false,
            message:"Unauthorized user"
        })
    }
    next();
}