import Sequelize, { Model } from 'sequelize';

class File extends Model {
  static init(sequelize) {
    // sequelize é a var q recebe Connection
    super.init(
      {
        name: Sequelize.STRING,
        path: Sequelize.BOOLEAN,
        url: {
          type: Sequelize.VIRTUAL,
          get() {
            return `${process.env.APP_URL}/files/${this.path}`;
          },
        },
      },
      {
        sequelize, // sequelize é a var q recebe Connection
      }
    );

    return this;
  }
}

export default File;
