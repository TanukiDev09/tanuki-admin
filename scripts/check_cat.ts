import mongoose from 'mongoose';
import Category from './src/models/Category';
import dotenv from 'dotenv';
dotenv.config();

async function check() {
  await mongoose.connect(process.env.MONGODB_URI!);
  const id = '696a59a50caae86890c9f924';
  const cat = await Category.findById(id);
  console.log('Category found:', cat);

  const catByString = await Category.findOne({ _id: id });
  console.log('Category found by string:', catByString);

  await mongoose.connection.close();
}

check();
