const express = require("express");
const app = express();
const db = require("./db");

app.use(express.json());

// Ruta test
app.get("/", (req, res) => {
  res.send("Backend funcionando 🔥");
});

// Obtener propiedades
app.get("/propiedades", (req, res) => {
  db.query("SELECT * FROM propiedades", (err, results) => {
    if (err) {
      console.error(err);
      res.status(500).send("Error en DB");
      return;
    }
    res.json(results);
  });
});

// Agregar propiedad
app.post("/propiedades", (req, res) => {
  const { direccion, precio, estado } = req.body;

  const sql = "INSERT INTO propiedades (direccion, precio, estado) VALUES (?, ?, ?)";

  db.query(sql, [direccion, precio, estado], (err, result) => {
    if (err) {
      console.error(err);
      res.status(500).send("Error al insertar");
      return;
    }
    res.json({ mensaje: "Propiedad agregada" });
  });
});

app.listen(3001, () => {
  console.log("Servidor en http://localhost:3001");
  const cors = require("cors");
  app.use(cors());
});