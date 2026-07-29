import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { routes } from './routes';

const app = express();

app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  })
);
app.use(express.json());

app.get('/', (_request, response) => {
  return response.status(200).send('API running');
});

app.use(routes);

const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});
