// MySQL devolve DECIMAL como string; estes helpers padronizam para Number.
const arredondar = (valor, casas = 2) => {
  const f = 10 ** casas;
  return Math.round((Number(valor) + Number.EPSILON) * f) / f;
};
const paraNumero = (valor) => (valor === null || valor === undefined ? 0 : arredondar(valor));
module.exports = { arredondar, paraNumero };
