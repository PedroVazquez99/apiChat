const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios"); // Para hacer solicitudes HTTP
const app = express();

// Cargo las variables de entorno
const dotenv = require("dotenv");
dotenv.config();
const port = process.env.PORT || 3000;
const host = process.env.HOST;
const api = process.env.API;
const langu = process.env.LANGU;
const auth = process.env.AUTH;

const options = {
  method: "GET",
  headers: {
    accept: "application/json",
    Authorization: auth,
  },
};

// Lógica para manejar /pedidos
app.get("/estrenos", async (req, res) => {
  try {
    const url = api + "/movie/upcoming?" + langu;
    const response = await axios.get(url, options);
    res.json(response.data.results[0].title);
  } catch (error) {
    res.status(500).json({ error: "Hubo un error al obtener los pedidos." });
  }
});
