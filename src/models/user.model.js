import Mongoose,{ Schema } from "mongoose";
import { jwt } from "jsonwebtoken";
import bcrypt from "bcrypt"

const userSchema = new Schema(
  {
    username: {
      type: String,
      lowercase: true,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    email: {
      type: String,
      lowercase: true,
      required: true,
      unique: true,
      trim: true,
    },
    fullname: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    avatar: {
      type: String, // cloudinary URL
      required: true,
    },
    coverImage: {
      type: String, // cloudinary URL
    },
    watchHistory: [
      {
        type: Schema.Types.ObjectId,
        ref: "Video"
      }
    ],
    password: {
      type: String,
      required : [true, 'Password is required!!']
    },
    refreshToken: {
      type: String
    }
  },
  {
    timestamps: true
  }
)

// Password encryption with bcrypt
userSchema.pre("save", async function(next) {
  if(!this.isModified("password")) return next();

  this.password = bcrypt.hash(this.password, 10)
  next()
})

userSchema.methods.isPassowordCorrect = async function 
(password) {
  return await bcrypt.compare(password, this.password)
}

userSchema.methods.generateAccessToken = function () {
  jwt.sign(
    {
      _id: this._id,
      email: this.email,
      username: this.username,
      fullname: this.fullname
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY
    }
  )
}

userSchema.methods.generateRefreshToken = function () {
  jwt.sign(
    {
      _id: this._id,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY
    }
  )
}

export const User = Mongoose.model("User", userSchema)