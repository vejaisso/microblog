const Department = require('../models/Department');

exports.createDepartment = async (req, res) => {
  try {
    const { name } = req.body;
    const dept = await Department.create({ name });
    res.status(201).json(dept);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.listDepartments = async (req, res) => {
  const depts = await Department.findAll();
  res.json(depts);
};
