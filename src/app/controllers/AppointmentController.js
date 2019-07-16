// Appointment
import * as Yup from 'yup';
import { startOfHour, parseISO, isBefore, format, subHours } from 'date-fns';
import pt from 'date-fns/locale/pt-BR';
import User from '../models/User';
import File from '../models/File';
import Appointment from '../models/Appointment';
import Notification from '../schemas/Notification';

import CancellationMail from '../jobs/CancellationMail';
import Queue from '../../lib/Queue';

class AppointmentController {
  /** ====================================================
   * Lista de Agendamento
   */
  async index(req, res) {
    const { page = 1 } = req.query;

    const appointments = await Appointment.findAll({
      attributes: ['id', 'date', 'user_id', 'past', 'cancelable'],
      where: {
        user_id: req.userId,
        canceled_at: null,
      },
      order: ['date'],
      limit: 20,
      offset: (page - 1) * 20,
      include: [
        {
          model: User,
          as: 'provider',
          attributes: ['id', 'name'],
          include: [
            {
              model: File,
              as: 'avatar',
              attributes: ['id', 'path', 'url'],
            },
          ],
        },
      ],
    });

    return res.json(appointments);
  }

  /** ====================================================
   * Grava Agendamento
   */
  async store(req, res) {
    // Validação na Inclusão do Agendamento----------
    // Validação Esquema (schema) com (Yup)
    const schema = Yup.object().shape({
      provider_id: Yup.number().required(),
      date: Yup.date().required(),
      client_id: Yup.number(),
    });
    // Validação dos campos utilizando esquema (schema) acima
    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation create fails.' });
    }

    // eslint-disable-next-line camelcase
    const { provider_id, client_id, date } = req.body;

    /**
     * Check if provider_id is a provider
     */
    const checkisProvider = await User.findOne({
      where: { id: provider_id, provider: true },
    });

    if (!checkisProvider) {
      return res
        .status(401)
        .json({ error: 'You can only create appointments with providers' });
    }

    /**
     * Se o client_id for informado,
     * atribuir client_id ao req.userId
     */
    if (client_id) {
      req.userId = client_id;
      console.log(req.userId);
    }

    /**
     * Check if user equal provider
     */
    if (req.userId === provider_id) {
      return res
        .status(400)
        .json({ error: 'User can not be equal to the provider' });
    }

    /**
     * Verificar a data e hora do agendamento
     */
    const hourStart = startOfHour(parseISO(date)); // deixa apenas hora inteira
    // Verifica se Data/hora sao futuras
    if (isBefore(hourStart, new Date())) {
      return res.status(400).json({ error: 'Past dates are not permitted' });
    }

    /**
     * Verifica se o prestador já não tem agendamente p Data/Hora
     * Check date Availability
     */
    const checkAvailability = await Appointment.findOne({
      where: {
        provider_id,
        canceled_at: null,
        date: hourStart,
      },
    });
    if (checkAvailability) {
      return res
        .status(400)
        .json({ error: 'Appointment date is not available' });
    }

    /**
     * Criar agendamento
     */
    const appointment = await Appointment.create({
      user_id: req.userId,
      provider_id,
      date,
    });

    /**
     * Notificar prestador de serviço
     */
    const user = await User.findByPk(req.userId);
    const formattedDate = format(
      hourStart,
      "'dia' dd 'de' MMMM', às' H:mm'h'",
      { locale: pt }
    );

    await Notification.create({
      content: `Novo agendamento de ${user.name} para ${formattedDate}`,
      user: provider_id,
    });

    /*
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
    */
    return res.json(appointment);
  }

  /** ====================================================
   * Deleta Agendamento
   */
  async delete(req, res) {
    // const appointment = await Appointment.findByPk(req.params.id);
    const appointment = await Appointment.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'provider',
          attributes: ['name', 'email'],
        },
        {
          model: User,
          as: 'user',
          attributes: ['name'],
        },
      ],
    });

    // Apenas o proprio usuario pode cancelar seus agendamentos
    if (appointment.user_id !== req.userId) {
      return res.status(401).json({
        error: "You don't have permission to cancel this appointment.",
      });
    }

    // Não permitir deletar agendamento com menos de 2H do horario
    // Funcao q retira (2h) da data/hora do agendamento
    const dateWithSub = subHours(appointment.date, 2);
    if (isBefore(dateWithSub, new Date())) {
      return res.status(401).json({
        error: 'You can only cancel appointments 2 hours in advance.',
      });
    }

    // Cancelar Agendamento
    appointment.canceled_at = new Date();
    await appointment.save();

    // Enviar email (Fila Queue)
    await Queue.add(CancellationMail.key, {
      appointment,
    });

    /*
    // Enviar email
    await Mail.sendMail({
      to: `${appointment.provider.name} <${appointment.provider.email}>`,
      subject: 'Agendamento cancelado',
      template: 'cancellation',
      context: {
        provider: appointment.provider.name,
        user: appointment.user.name,
        date: format(appointment.date, "'dia' dd 'de' MMMM', às' H:mm'h'", {
          locale: pt,
        }),
      },
    });
    */
    return res.json(appointment);
  }
}

export default new AppointmentController();
