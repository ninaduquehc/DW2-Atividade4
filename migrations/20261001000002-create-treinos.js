'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('treinos', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      codigo: { type: Sequelize.STRING(30), allowNull: false },
      jogadorId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'jogadores', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT', // preserva o histórico
      },
      dataTreino: { type: Sequelize.DATE, allowNull: false },
      tipo: { type: Sequelize.ENUM('F', 'T', 'E'), allowNull: false },
      duracaoMin: { type: Sequelize.INTEGER, allowNull: false },
      intensidade: { type: Sequelize.INTEGER, allowNull: false },
      carga: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addConstraint('treinos', {
      fields: ['codigo'],
      type: 'unique',
      name: 'uq_treinos_codigo',
    });
    await queryInterface.addIndex('treinos', ['jogadorId', 'dataTreino'], { name: 'idx_treinos_jogador_data' });
    await queryInterface.addIndex('treinos', ['dataTreino'], { name: 'idx_treinos_data' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('treinos');
  },
};
