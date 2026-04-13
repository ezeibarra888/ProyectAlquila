fetch("http://localhost:3001/propiedades")
  .then(res => res.json())
  .then(data => {
    const contenedor = document.getElementById("lista");

    data.forEach(p => {
      const div = document.createElement("div");
      div.innerHTML = `
        <p>${p.direccion} - $${p.precio} (${p.estado})</p>
      `;
      contenedor.appendChild(div);
    });
  });