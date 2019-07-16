import jwt from 'jsonwebtoken';
import { promisify } from 'util';

import authConfig from '../../config/auth';

export default async (req, res, next) => {
  // Pegar token
  const authHeader = req.headers.authorization;
  // Verifica se token foi informado no header
  if (!authHeader) {
    return res.status(401).json({ error: 'Token not provided.' });
  }
  // Atribui a const token
  const [, token] = authHeader.split(' ');

  try {
    // Decodifica o token e atribui seus elementos a decoded
    const decoded = await promisify(jwt.verify)(token, authConfig.secret);
    // Pega o Id do usuario de dentro do token
    req.userId = decoded.id;

    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Token invalid.' });
  }
};
