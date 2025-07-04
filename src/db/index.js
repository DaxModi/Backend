import mongoose from "mongoose" 
import {DB_NAME} from "../constants.js"


// Semicolon always before immidiatly invoked function expressions

const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
    console.log(`\n MongoDB connected DB host: ${connectionInstance.connection.host}`);
    
  } catch (error) {
    console.log("ERROR: ",error);
    process.exit(1)
  }
}

export default connectDB