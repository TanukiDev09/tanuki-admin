import mongoose from 'mongoose';
import Movement from './src/models/Movement';
import dotenv from 'dotenv';
dotenv.config();

async function check() {
  await mongoose.connect(process.env.MONGODB_URI!);
  const movements = await Movement.find({
    category: '696a59a50caae86890c9f924',
  }).limit(5);
  console.log(
    'Movements with this category:',
    movements.map((m) => ({ description: m.description, amount: m.amount }))
  );
  await mongoose.connection.close();
}

check();
