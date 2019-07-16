import * as Yup from 'yup';

import jwt from 'jsonwebtoken'; // Importacao de modulo tem q vir antes

import User from '../models/User';

import authConfig from '../../config/auth';

class SessionController {
  async store(req, res) {
    // Validação dos campos de entrada
    const schema = Yup.object().shape({
      email: Yup.string()
        .email()
        .required(),
      password: Yup.string().required(),
    });
    // Validação dos campos utilizando esquema (schema) acima
    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation session fails.' });
    }

    // Gerar Sessão de contrle de usuario (token)
    const { email, password } = req.body;
    // Verifica se email existe
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({ error: 'User not found.' });
    }

    // Verificar se a senha bate (usando metodo do user)
    if (!(await user.checkPassword(password))) {
      return res.status(400).json({ error: 'Password does not mach.' });
    }

    const { id, name } = user;
    return res.json({
      user: {
        id,
        name,
        email,
      },
      token: jwt.sign({ id }, authConfig.secret, {
        expiresIn: authConfig.expiresIn,
      }),
    });
  }
}

export default new SessionController();
