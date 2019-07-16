import User from '../models/User';
import Notification from '../schemas/Notification';

class NotificationController {
  async index(req, res) {
    /**
     * Check if req.userId is a provider
     */
    const checkisProvider = await User.findOne({
      where: { id: req.userId, provider: true },
    });

    if (!checkisProvider) {
      return res
        .status(401)
        .json({ error: 'Only provider can load notifications' });
    }

    /**
     * Listar notificacoes usando shemas
     */
    const notifications = await Notification.find({
      user: req.userId,
    })
      .sort({ createdAt: 'desc' })
      .limit(20);

    return res.json(notifications);
  }

  async update(req, res) {
    // const notfication = await Notification.findById(req.params.id);
    const notification = await Notification.findByIdAndUpdate(
      // (findByIdAndUpdate)metodo do mongoose q procura e ja altera o registro
      req.params.id, // param de pesquisa
      { read: true }, // campo q sera alterado e valor
      { new: true } // retorna para (notification) o novo registro alterado
    );

    return res.json(notification);
  }
}

export default new NotificationController();
