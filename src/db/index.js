import mongoose from "mongoose";
import { DB_NAME } from "../constant.js";

const DBconnection = async()=>{
      try {
        const ConnectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        console.log(`/n MngoDB connected !! DB Host : ${ConnectionInstance.connection.host}`)
        
      } catch (error) {
        console.log("Connection Error",error);
        process.exit(1);
      }
}

export default DBconnection;