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
const miAuth = process.env.AUTH;
const apiKey = process.env.APIKEY;

const optionsGET = {
  method: "GET",
  headers: {
    accept: "application/json",
    Authorization: miAuth,
  },
};

const optionsPOST = {
  method: "POST",
  headers: {
    accept: "application/json",
    Authorization: miAuth,
  },
};

// ------------------------------------------------------- GET -------------------------------------------------------

// Obtengo el Request token
async function requestTokenFunc() {
  try {
    const reqtoken = null;
    const apiURL = api + "/authentication/token/new?" + apiKey;
    console.log(apiURL);
    const responseAxios = await axios.get(apiURL, optionsGET);
    console.log("El reultado es :");
    console.log(responseAxios.data);
    return {
      reponseAxios: responseAxios.data,
      urlFullfilment:
        "https://www.themoviedb.org/authenticate/" +
        responseAxios.data.request_token,
    };
  } catch (error) {
    console.log("Error en requestToken");
  }
}

async function authMovieFunc(request_token) {
  try {
    console.log("request_token");
    console.log(request_token);
    const urlApi = "https://www.themoviedb.org/authenticate/" + request_token;
    console.log(urlApi);
    const responseAxios = await axios.get(urlApi, optionsGET);

    return {
      urlFullfilment: urlApi,
    };
  } catch (error) {
    console.log("Error en auth");
  }
}

// ------------------------------------------------------- POST -------------------------------------------------------
async function createSessionFunc(req_token) {
  try {
    const apiUrl =
      "https://api.themoviedb.org/3/authentication/session/new?" + apiKey;
    optionsPOST.headers["content-type"] = "application/json";
    const responsePostGuardar = await axios.post(
      apiUrl,
      { request_token: req_token },
      optionsPOST
    );

    console.log("La respuesta que devuelve despues de recuperar el sesion Id");
    console.log(responsePostGuardar.data);
    return responsePostGuardar.data;
  } catch (error) {
    console.log(error);
  }
}

async function guardarPelis(pelisIds) {
  try {
    console.log(pelisIds);
  } catch (error) {
    console.log("Fallo al guardar las pelis");
    console.log(error);
  }
}

module.exports = {
  requestTokenFunc,
  authMovieFunc,
  createSessionFunc,
  guardarPelis,
};
