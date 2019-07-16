import * as Yup from 'yup';
import User from '../models/User';
import File from '../models/File';

class UserController {
  // =========================================================================
  // Criação de usuario
  //
  async store(req, res) {
    // Validação na Inclusão do Usuario----------
    // Validação Esquema (schema) com (Yup)
    const schema = Yup.object().shape({
      name: Yup.string().required(),
      email: Yup.string()
        .email()
        .required(),
      password: Yup.string()
        .required()
        .min(6),
    });
    // Validação dos campos utilizando esquema (schema) acima
    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation create fails.' });
    }

    // Verificar se existe algum User com o mesmo email
    const userExists = await User.findOne({ where: { email: req.body.email } });

    if (userExists) {
      return res.status(400).json({ error: 'User already exists.' });
    }

    // const user = await User.create(req.body); //Todos os campos
    const { id, name, email, provider } = await User.create(req.body);

    // return res.json(user); //Todos os campos
    return res.json({
      id,
      name,
      email,
      provider,
    });
  }

  // =========================================================================
  // Altera dados do usuario
  //
  async update(req, res) {
    // Validação na Alteração do Usuario----------
    // Validação Esquema (schema) com (Yup)
    const schema = Yup.object().shape({
      name: Yup.string(),
      email: Yup.string().email(),
      oldPassword: Yup.string().min(6),
      password: Yup.string()
        .min(6)
        .when('oldPassword', (oldPassword, field) =>
          oldPassword ? field.required() : field
        ),
      confirmPassword: Yup.string().when('password', (password, field) =>
        password ? field.required().oneOf([Yup.ref('password')]) : field
      ),
    });
    // Validação dos campos utilizando esquema (schema) acima
    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation 1 update fails.' });
    }

    const { email, oldPassword } = req.body;
    // Apartir daqui a manipulacao sera na const user,
    // pois user recebeu o find do modelo User
    const user = await User.findByPk(req.userId);

    // Verifica se mudou o email e se o novo email ja existe

    if (email !== user.email) {
      const userExists = await User.findOne({ where: { email } });

      if (userExists) {
        return res.status(400).json({ error: 'User already exists.' });
      }
    }

    // Verifica se a senha anterior é igual a do cadastro
    if (oldPassword && !(await user.checkPassword(oldPassword))) {
      return res.status(401).json({ error: 'Password does not match.' });
    }

    await user.update(req.body);

    const { id, name, avatar } = await User.findByPk(req.userId, {
      include: [
        {
          model: File,
          as: 'avatar',
          attributes: ['id', 'path', 'url'],
        },
      ],
    });

    return res.json({
      id,
      name,
      email,
      avatar,
    });
  }
}

export default new UserController();
