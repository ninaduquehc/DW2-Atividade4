'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('jogadores', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      nome: { type: Sequelize.STRING(120), allowNull: false },
      posicao: { type: Sequelize.ENUM('G', 'Z', 'M', 'A'), allowNull: false },
      ativo: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('jogadores', ['posicao'], { name: 'idx_jogadores_posicao' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('jogadores');
  },
};
