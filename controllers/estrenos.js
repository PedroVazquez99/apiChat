const express = require("express");
const bodyParser = require("body-parser");
const request = require("request");
const https = require("https");

const app = express();
app.set("port", process.env.PORT || 5000);

//process application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

//body-parser JSON POST/PUT Content-Type: application/json
app.use(bodyParser.json());

//directory for static files
app.use(express.static(__dirname + "public"));

// Server
app.listen(app.get("port"), function () {
  console.log("Running on port", app.get("port"));
});

// Index route
app.get("/", function (req, res) {
  respuesta = {
    error: true,
    codigo: 200,
    mensaje: "Init Ada-bot",
  };
  res.send(respuesta);
});

/*
 * Test POST endpoint to Dialogflow
 * API OpenWeatherMap
 */
app.post("/weather/", function (req, res) {
  //Request from Dialogflow
  console.log(JSON.stringify(req.body));

  //parameters
  let pcity = req.body.queryResult.parameters.geocity;
  let pkey = "Obtener token";
  let url = `https://api.openweathermap.org/data/2.5/weather?q=${pcity}&APPID=${pkey}`;

  // get API RESTful https
  request(url, function (error, response, body) {
    // convert to JSON
    let obj = JSON.parse(body);
    console.log(obj);

    var botSpeech = "Error";

    if (obj.cod == "200") {
      //Response to Dialogflow
      //let qresponse = new Object();

      let kelvin = 273.15;
      let temperature =
        Math.round(parseFloat(obj.main.temp - kelvin) * 100) / 100;

      botSpeech =
        "La temperatura en " +
        pcity +
        " es de " +
        temperature +
        "ÂºC y el tiempo '" +
        obj.weather[0].description +
        "'";
    }

    /*
     * Object response --> res.send
     */
    res.setHeader("Content-Type", "application/json");

    out = {
      fulfillmentText: botSpeech,
      fulfillmentMessages: null,
    };

    var outString = JSON.stringify(out);
    res.send(outString);
  });
});

function handle_error(qParameters) {
  out = {
    fulfillmentText: "Se ha producido un error",
    fulfillmentMessages: null,
  };

  return out;
}
