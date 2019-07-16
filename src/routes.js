import { Router } from 'express';
import multer from 'multer';
import multerConfig from './config/multer';

import UserController from './app/controllers/UserController';
import SessionController from './app/controllers/SessionController';
import FileController from './app/controllers/FileController';
import ProviderController from './app/controllers/ProviderController';
import AppointmentController from './app/controllers/AppointmentController';
import ScheduleController from './app/controllers/ScheduleController';
import NotificationController from './app/controllers/NotificationController';
import AvailableController from './app/controllers/AvailableController';

import authMiddleware from './app/middlewares/auth';

const routes = new Router();
const upload = multer(multerConfig);

// Inclui usuario
routes.post('/users', UserController.store);
// Gera sessão de controle de usuario (token)
routes.post('/sessions', SessionController.store);

/*
rota com Middleware Global
executada antes de todas as rotas a baixo
*/
// Verifica token
routes.use(authMiddleware);

// Altera dados do usuario
routes.put('/users', UserController.update);

routes.get('/providers', ProviderController.index);
routes.get('/providers/:providerId/available', AvailableController.index);

// AppointmentController
routes.get('/appointments', AppointmentController.index);
routes.post('/appointments', AppointmentController.store);
routes.delete('/appointments/:id', AppointmentController.delete);

routes.get('/schedule', ScheduleController.index);

routes.get('/notifications', NotificationController.index);
routes.put('/notifications/:id', NotificationController.update);

routes.post('/files', upload.single('file'), FileController.store);
// rota com Middleware Local
// routes.put('/users', authMiddleware, UserController.update);

// routes.get('/teste', (req, res) => {
//  res.send('Homepage! Hello world.');
// });

export default routes;

/*
import { Router } from 'express';
import User from './app/models/User';

const routes = new Router();

routes.get('/', async (req, res) => {
  const user = await User.create({
    name: 'William Mendonça',
    email: 'william@tecmasternet.com.br',
    password_hash: '12345678',
  });
  // return res.json({ message: 'Bem vindo William' });
  return res.json(user);
});

export default routes;
*/
