var fs = require('fs');
const csv = require('csv-parser');

let tiempos = ["5","15"];

fs.readdir("./Json", function (err, archivos) {
  if (err) {
  onError(err);
  return;
  }
  console.log(archivos);
  for(let a of archivos){
    crearCSV(a);
  }
  });




function crearCSV(archivo){

  fs.readFile('./Json/'+archivo, 'utf8', function readFileCallback(err, data){
    if (err){
        console.log(err);
    } else {
    obj = JSON.parse(data); //now it an object
    console.log(crearCSV(obj.table,archivo.split(".")[0]))
}});

function crearCSV (array,archivo){
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const csvWriter = createCsvWriter({
  path: archivo+'.csv',
  header: [
    {id: 'fecha', title: 'Fecha'},
    {id: 'simbolo', title: 'Símbolo'},
    {id: 'direccion', title: 'Direccion'},
    {id: 'jugada', title: 'Jugada'},
    {id: 'entrada', title: 'Entrada'},
    {id: 'stop', title: 'Stop'},
    {id: 'riesgo', title: 'Riesgo'},
    {id: 'lotes', title: 'lotes'},
    {id: 'ru', title: 'RU'},


  ]
});

const data = array;

csvWriter
  .writeRecords(data)
  .then(()=> console.log('The CSV file was written successfully'));
}

}
