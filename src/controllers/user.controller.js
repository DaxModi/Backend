import {asyncHandler} from  "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from  "../models/user.model.js"
import {uploadOnCloudianry} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"

const genertateAccessAndRefreshTokens = async(userId) => {
  try {
    const user = await User.findById(userId)
    const accessToken = user.generateAccessToken()
    const refreshToken = user.generateRefreshToken()

    user.refreshToken = refreshToken
    await user.save({ validateBeforeSave: false })

    return {accessToken, refreshToken}
  } catch (error) {
    throw new ApiError(500, "Somthing went Wrong while generating refresh and access token!!")
  }
}

const registerUser = asyncHandler( async (req, res) => {
  // get user details from frontend
  // validation - not empty
  // check if user alredy exists: username, email
  // check for images, check for avatar
  // upload them to cloudianry, avatar
  // create user object - create entry in db
  // remove password and refresh token feild from response
  // check for creation
  // return res

  const {fullName, email, username, password} = req.body
  // console.log(email);

  if([fullName, email, username, password].some((feild) => feild?.trim() === ""))
  {
    throw new ApiError(400, "All Feilds are compulsary required");
  } 

  const existedUser = await User.findOne({
    $or : [{username}, {email}]
  })
  
  if(existedUser) throw new ApiError(409, "User with email or username alredy exists!!");

  // console.log(req.files);
  
  const avatarLocalPath = req.files?.avatar[0]?.path;
  // const coverImageLocalPath = req.files?.coverImage[0]?.path;

  let coverImageLocalPath;
  if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
    coverImageLocalPath = req.files.coverImage[0].path
  }

  if(!avatarLocalPath) throw new ApiError(400, "Avatar Files Required!!")

  const avatar = await uploadOnCloudianry(avatarLocalPath)
  const coverImage = await uploadOnCloudianry(coverImageLocalPath)

  if(!avatar) throw new ApiError(400, "Avatar Files Required!!")

  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username : username.toLowerCase()
  })
  
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  )

  if(!createdUser) throw new ApiError("Somthing went wrong while registering the user!")

  return res.status(201).json(
    new ApiResponse(200, createdUser, "User registerd Successfully")
  )
})

const loginUser = asyncHandler( async (req, res) => {
  // req body -> data
  // username or email
  // find the user
  // password check
  // access and refresh token 
  // send cookie 

  const {email, username, password} = req.body

  if(!username && !email) throw new ApiError(400, "username or password is required!");
  
  const user = await User.findOne({
    $or: [{ username: username?.toLowerCase() }, { email }],
  });

  if(!user) throw new ApiError("User does not exists!!");
  
  const isPasswordValid = await user.isPasswordCorrect(password)

  if(!isPasswordValid) throw new ApiError("Invalid user Credintials!!");


  const {accessToken, refreshToken} = await genertateAccessAndRefreshTokens(user._id)
  console.log(accessToken, refreshToken)
  const loggedInUser = await User.findById(user._id).
  select("-password -refreshToken")

  const options = {
    httpOnly: true,
  }
  
  return res
  .status(200)
  .cookie("accessToken", accessToken, options)
  .cookie("refreshToken", refreshToken, options)
  .json(
    new ApiResponse(
      200,
      {
        user: loggedInUser, accessToken,refreshToken
      },
      "User logged in successFully!!"
    )
  )

})

const logoutUser = asyncHandler( async(req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined
      }
    },
    {
      new: true
    }
  )

  
  const options = {
    httpOnly: true,
  }
  
  return res
  .status(200)
  .clearCookie("accessToken", options)
  .clearCookie("refreshToken", options)
  .json(new ApiResponse(200, {}, "User Logged out!"))

})


const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

  if(!incomingRefreshToken) throw new ApiError(401, "unauthorized request");

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    )
  
    const user = await User.findById(decodedToken?._id)
  
    if(!user) throw new ApiError(401, "invalid refresh Token");
  
    if(incomingRefreshToken !== user?.refreshToken) throw new ApiError(401, "refresh token is expired or used");
  
    const options = {
      httpOnly: true,
      secure: true
    }
  
    const {accessToken, newRefreshToken} = await genertateAccessAndRefreshTokens(user._id)
    
    return res
    .status(200)
    .cookie("accessToken",accessToken, options)
    .cookie("refreshToken",newRefreshToken, options)
    .json(
      new ApiResponse(
        200, 
        {accessToken, refreshToken: newRefreshToken},
        "AccessToken refreshed successfully"
      )
    )
  } catch (error) {
    throw new ApiError(401, "unauthorized request");
    
  }
  
})


export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken
}