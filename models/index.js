/**
 * @fileoverview Exportador central de modelos
 *
 * Este archivo centraliza todos los modelos para facilitar su importación.
 * En lugar de hacer múltiples imports, puedes hacer:
 *
 * const { User, Lead, Content } = require('./models');
 *
 * @author Boost Agency Development Team
 * @version 2.0.0
 */

const User = require("./User");
const Lead = require("./Lead");
const Content = require("./Content");
const Service = require("./Service");
const BlogPost = require("./BlogPost");
const Plan = require("./Plan");
const Product = require("./Product");

module.exports = {
  User,
  Lead,
  Content,
  Service,
  BlogPost,
  Plan,
  Product,
};
