import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

mongoose
    .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log('✅ Test connection succeeded');
        process.exit(0);
    })
    .catch(err => {
        console.error('❌ Test connection failed', err);
        process.exit(1);
    });
