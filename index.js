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
const miKey = process.env.APIKEY;
const accountID = process.env.ACCOUNTID;

const {
  requestTokenFunc,
  createSessionFunc,
  guardarPelis,
} = require("./helpers/auth");

let parametros = null;

// Sesiones
var REQ_TOKEN = null;
var SESSION_ID = "94d188d8c771f34a9dc86448e6ccf1b14dfdb803";
var PELIS_RECOMENDADAS = null;
var BODYInts = null;
//Llamadas
const options = {
  method: "GET",
  headers: {
    accept: "application/json",
    Authorization: auth,
  },
};

// Middleware para parsear JSON
app.use(express.json());

// Funcion para comparar generos
function quitarAcentos(str) {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function intentParams(nameIntent) {
  const outputContexts = BODYInts.queryResult.outputContexts;
  const contextoParams = outputContexts.find((ctx) =>
    ctx.name.includes(nameIntent)
  );
  return contextoParams;
}

async function isSessionActiva() {
  try {
    const x = await axios.get(
      api + "/account?" + miKey + "&session_id=" + SESSION_ID
    );
  } catch (error) {
    console.log(error);
  }
}

// RUTAS DE LA API
app.get("/", async (req, res) => {
  res.json({
    fulfillmentText: "Respuesta de la API:",
  });
});

// Lógica para manejar /pedidos
app.get("/estrenos", async (req, res) => {
  try {
    let responseText = "Los últimos estrenos son: ";
    const url = api + "/movie/upcoming?" + langu;
    const response = await axios.get(url, options);
    responseText += "\r\n";
    response.data.results.forEach((e, idx) => {
      idx += 1;
      responseText += idx + ". " + e.title + "\r\n";
    });

    res.json({ fulfillmentText: responseText });
  } catch (error) {
    res.status(500).json({ error: "Hubo un error al obtener los pedidos." });
  }
});

// Lógica para manejar /pedidos
app.get("/generos", async (req, res) => {
  try {
    console.log("Entro en las lista de pelis");
    let id = [];
    let fulfillmentText =
      "Las peliculas que te recomendamos con esos géneros son: ";
    let generosLista = null;
    // Peticion para obtener los generos de las peliculas
    await fetch(api + "/genre/movie/list?" + langu, options)
      .then((response) => response.json())
      .then((data) => {
        generosLista = data;
      });

    if (parametros) {
      console.log("Los parametros son:" + parametros);
      parametros.genero.forEach((gen) => {
        generosLista.genres.forEach((e) => {
          if (
            quitarAcentos(e.name.toLowerCase()) ===
            quitarAcentos(gen.toLowerCase())
          ) {
            id.push(e.id);
          }
        });
      });

      let pelis = null;

      await fetch(
        api + "/discover/movie?" + langu + "&with_genres=" + id.join(","),
        options
      )
        .then((response) => response.json())
        .then((data) => {
          pelis = data;
          PELIS_RECOMENDADAS = data;
        });

      pelis.results.forEach((p, idx) => {
        idx += 1;

        fulfillmentText += "\r\n" + idx + ". " + p.title;
      });
    }
    res.json({ fulfillmentText: fulfillmentText });
  } catch (error) {
    res.status(500).json({ error: "Hubo un error al obtener los pedidos." });
  }
});

// Resumen de una pelicula
app.get("/info", async (req, res) => {
  try {
    let responseText = "Entro en añadir pelicula a la lista.";
    await res.json({ fulfillmentText: responseText });
  } catch (error) {
    res.status(500).json({ error: "Hubo un error al obtener los pedidos." });
  }
});

// Guardar en la lista de peliculas
app.get("/confirmarToken", async (req, res) => {
  try {
    const tokenDataVar = await requestTokenFunc();
    REQ_TOKEN = tokenDataVar.reponseAxios.request_token;
    res.json({
      fulfillmentText:
        "Debe dirigirse al siguiente enlace para dar permiso: " +
        tokenDataVar.urlFullfilment,
    });
  } catch (error) {
    res.status(500).json({ error: "Hubo un error al obtener los pedidos." });
  }
});

async function postPeliculas(pelisArrays) {
  try {
    for (const p of pelisArrays) {
      console.log(p.id);
      console.log(
        api + "/account/" + accountID + "/watchlist?session_id=" + SESSION_ID
      );
      await axios.post(
        api + "/account/" + accountID + "/watchlist?session_id=" + SESSION_ID,
        {
          media_type: "movie",
          media_id: p.id,
          watchlist: true,
        },
        {
          method: "POST",
          headers: {
            accept: "application/json",
            Authorization: auth,
            "content-type": "application/json",
          },
        }
      );
    }
  } catch (error) {
    console.log(error);
  }
}

app.get("/finAnyadir", async (req, res) => {
  try {
    let fulfillmentTextVar = "Su sesión ha caducado";
    // console.log(REQ_TOKEN);

    const sessionActiva = await axios.get(
      api + "/account?" + miKey + "&session_id=" + SESSION_ID
    );

    if (sessionActiva.status != 200) {
      const authDataVar = await createSessionFunc(REQ_TOKEN);
      SESSION_ID = authDataVar.session_id;
    }

    const ctxt = intentParams("anyadiralista");
    console.log("ctxt", ctxt);
    console.log(ctxt.parameters.number);

    const peliculasFiltradas = ctxt.parameters.number.map(
      (index) => PELIS_RECOMENDADAS.results[index - 1]
    );
    console.log(peliculasFiltradas);
    await postPeliculas(peliculasFiltradas);
    fulfillmentTextVar = "Las peliculas se han guardado correctamente.";
    // console.log("Fin de finAnyadir");

    // await guardarPelis();
    res.json({
      fulfillmentText: fulfillmentTextVar,
    });
  } catch (error) {
    res.status(500).json({ error: "Hubo un error al obtener los pedidos." });
  }
});

// Lógica para manejar los INTENTS de Dialogflow
app.post("/dialogflow", async (req, res) => {
  BODYInts = req.body;
  const intentName = req.body.queryResult.intent.displayName; // Nombre del intent
  parametros = req.body.queryResult.parameters;
  let responseText;

  switch (intentName) {
    case "estrenos":
      apiUrl = host + "/estrenos";
      break;
    case "finAnyadir": // para añadir lista
      apiUrl = host + "/finAnyadir";
      break;
    case "anyadirALista": // para añadir lista (resumenPeli)
      const x = await axios.get(
        api + "/account?" + miKey + "&session_id=" + SESSION_ID
      );
      x.status == 200
        ? (apiUrl = host + "/finAnyadir")
        : (apiUrl = host + "/confirmarToken");
      break;
    case "elegirGenero":
      console.log("Generos ja");
      apiUrl = host + "/generos";
      break;
    default:
      responseText = "Lo siento, no entendí tu solicitud.";
  }

  try {
    const apiResponse = await axios.get(apiUrl);

    responseText = JSON.stringify(apiResponse.data);
    res.send(responseText);
  } catch (error) {
    responseText = "Hubo un error al obtener los datos.";
  }
});

// Levantar el servidor
app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});
