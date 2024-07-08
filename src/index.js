//  require('dotenv').config( {path : './env'})
import dotenv from "dotenv"
import DBconnection from "./db/index.js"
dotenv.config({
    path:"./env"
})
 
DBconnection()
.then(()=>{
    app.listen(process.env.PORT || 8000,()=>{
        console.log(`Listening on port ${process.env.PORT || 8000}`)
    } )
    
})
.catch((err)=>{
    console.log("error in connecting DB !!!", err);
})














 /*
 import express from "express"
 const app = express();
( async()=>{
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on("error",(error)=>{
            console.log(error);
            throw error;
        })
        app.listen(process.env.PORT ,()=>{
              console.log(`app is listening on port ${process.env.PORT}`)
        });
    } catch (error) {
        console.log(error);
        throw error;
    }
})()
*/