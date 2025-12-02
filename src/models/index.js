const User = require('./User');
const Product = require('./Product');
const Sale = require('./Sale');
const SaleDetail = require('./SaleDetail');

// Relaciones
User.hasMany(Sale, { foreignKey: 'cashierId', as: 'sales' });
Sale.belongsTo(User, { foreignKey: 'cashierId', as: 'cashier' });

Sale.hasMany(SaleDetail, { foreignKey: 'saleId', as: 'details' });
SaleDetail.belongsTo(Sale, { foreignKey: 'saleId', as: 'sale' });

Product.hasMany(SaleDetail, { foreignKey: 'productId', as: 'saleDetails' });
SaleDetail.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

module.exports = {
  User,
  Product,
  Sale,
  SaleDetail
};
