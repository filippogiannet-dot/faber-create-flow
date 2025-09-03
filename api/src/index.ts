import { NextApiRequest, NextApiResponse } from '@vercel/node';
import { greet } from './utils';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    res.status(200).json({ message: greet('World') });
  } else {
    res.status(405).json({ message: 'Method Not Allowed' });
  }
}