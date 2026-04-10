const axios = require('axios');
require('dotenv').config();

const USER_API_URL = process.env.USER_API_URL;

async function getUserById(userId, token) {
  try {
    const response = await axios.get(`${USER_API_URL}/usuarios/${userId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error('Erro ao chamar user-api:', error.message);
    throw new Error('Falha ao obter dados do usuário');
  }
}

module.exports = { getUserById };
