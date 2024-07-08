
import mongoose ,{Schema} from "mongoose";
import jwt from "jsonwebtoken"
import bcrypt from "brcypt"
const userSchema = new Schema(
    {
        username:{
            type: String,
            required : true,
            lowercase: true,
            trim:true,
            index:true
        },
        email:{
            type: String,
            required : true,
            lowercase: true,
            trim:true
        },
        fullname:{
            type : String,
            required:true,
            trim:true,
            index:true
        },
        avatar:{
            type: String, //Cloudnary Url
            required:true,
        },
        coverImage:{
            type: String, //Cloudnary Url
            required:false,
        },
        watchHistory:[
            {
                type:Schema.Types.ObjectId,
                ref: "Video"
            }
        ],
        password:{
            type: String,
            required:[true,"password is req"],
        },
        refreshToken:{
            type:String,
        }


    },
    {
        timestamps:true
    }
)
// middleware format(err,req,res,next)
// can't use arrow fxn in middleware bcz arrow fxn me this ka refe nhi hota(context nhi pta hota) aur yha context zarooei h kyonki save event user pr chal rha h
userSchema.pre("save", async function (next){
    // ab problem ye h ki ye hamesh run hoga chahe password change ho ya avatar ya kuch bhi attributes 
    //to we use if else
    if(this.isModified("password")){
        this.password = bcrypt.hash(this.password,10)
        next()
    }else{
        return next()
    }
    //checking password
    //custom methods
    userSchema.methods.isPasswordCorrect = async function (password){
       return await bcrypt.compare(password,this.password )
    }
    userSchema.methods.generateAccessToken = function (){
       return jwt.sign({
            _id:this._id,
            username:this.username,
            email:this.email,
            fullname : this.fullname
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn:process.env.ACCESS_TOKEN_EXPIRY
        }
    )
    }
    userSchema.methods.generateAccessToken = function (){
        return jwt.sign({
            _id:this._id,
            username:this.username,
            email:this.email,
            fullname : this.fullname
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn:process.env.REFRESH_TOKEN_EXPIRY
        }
    )
    }
   
})
export const User = mongoose.model("User",userSchema)