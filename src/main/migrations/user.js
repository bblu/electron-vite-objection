exports.up = function (knex) {
  return knex.schema.createTable('users', function (table) {
    table.string('id').primary() // 创建 id 字段并将其设为主键
    table.string('name') // 创建 name 字段
  })
}

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('users') // 如果表格存在，则删除它
}
