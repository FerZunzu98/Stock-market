const request = require('request');
var fs = require('fs');
const moment = require('moment');
const { format } = require('path');


async function Bucle (resolution){

    let array_acciones = ["AAPL","BABA","C","CVX","DIS","EBAY","META","GILD","GLD","IWM","KO","LVS","MET","NKE","NUGT","PYPL","QCOM","UAL","VZ","JPM","MS","MRK","MU","ORCL","SBUX","SPXL","UBER","WMT","WYNN","AMZN","JNJ","PG","IBM","NIO","XLE","X","GE","WBA","AAL","BAC","GM","DD","COP","ABBV","BMY","GOOG","NEE","NVDA","WDC","XLF","SHOP","ATVI","CVS","TMUS","MDT","FISV","PM","PEP","EWZ","FXI"];

    let operaciones_encontradas = [];
    console.log("Comenzando a analizar los gráficos de "+resolution+" minutos");

    let array_promises = [];

    let i = 0;
    
    for(let accion of array_acciones){
        
        let operacion = Peticion(accion,resolution)
        array_promises.push(operacion);

        if(i==10){

            await Delay();
            i=0;
        }

        i++;

    }
    let array_operaciones= [];
    await Promise.all(array_promises).then(values =>{
        
        values.sort(Compare);
        
        for(i=0;i<11; i++){
            console.log(values[i].divisas);
        }

        console.log("Revisión de los gráficos de "+resolution+" completada");
    })


    for(let operacion of array_operaciones){
        for(let orden of operacion.jugadas){

           await Crear_Json(orden);

        }
    }

    return;
}



function Peticion(accion,resolution) {

    let now= new Date();
    let fecha= Math.round(now.getTime()/1000);
    let inicio = fecha - 360000 * resolution;
    let analisis={
        divisas:accion,
        tiempo:resolution,
        parametros:{}
    };
    return new Promise(resolve => {
                 
        request('https://finnhub.io/api/v1/stock/candle?symbol='+accion+'&resolution='+resolution+'&from='+inicio+'&to='+fecha+'&token=c2qih02ad3ickc1loc60', { json: true }, (err, res, body) => {
            if (err) { return reject(err); }
            
            let datos = Formatear(res.body);
             
            if(resolution == 1 ){
                datos = Procesar(datos);
            }

            analisis.parametros=CuatroFantasticos(datos);

            resolve(analisis);

        }); 
    });
};

async function Inicio(){
    
    let minutos_5= await Bucle(5);

}


function CuatroFantasticos (array_datos) {
    
    if(!array_datos.h){
        console.log(array_datos);
    }

    let close = array_datos.c[array_datos.c.length-1];
    let MM200 = Math.round(Media200(array_datos.c,array_datos.c.length)*1000)/1000; 
    let MM20 = Math.round(Media20(array_datos.c,array_datos.c.length)*1000)/1000;
    
    
    let parametros = {
        m200_m20:Math.round((Math.abs(MM200-MM20)*100/MM200) * 100000)/100000,
        m200_CA:Math.round((Math.abs(MM200-close)*100/MM200) * 100000)/100000,
    };

    parametros.promedio = Math.round(((parametros.m200_m20 + parametros.m200_CA)/2)* 100000)/100000;
    
    return parametros;
}

function Formatear (array_datos){
    //console.log(array_datos);
    let datos_procesados = {
        c:[],
        h:[],
        l:[],
        o:[],
        t:[]
    }
    if(!array_datos.t){
        console.log(array_datos);
    }

    for(i=0;i<array_datos.t.length; i++){
        let date = new Date(array_datos.t[i] * 1000).toISOString();
        let date2 = date.split("T")[0] + "T20:00:00.000Z";
        let date3 = date.split("T")[0] + "T13:28:00.000Z"
        

        if(moment(date).isBefore(date2) && moment(date).isAfter(date3)){
            datos_procesados.c.push(array_datos.c[i]);
            datos_procesados.h.push(array_datos.h[i]);
            datos_procesados.l.push(array_datos.l[i]);
            datos_procesados.o.push(array_datos.o[i]);
            datos_procesados.t.push(array_datos.t[i]);
        }

    }

    return datos_procesados;
}

function Procesar (array_datos){
    let datos_procesados = {
        c:[],
        h:[],
        l:[],
        o:[],
        t:[]
    }

    for(i=array_datos.o.length-1;i>0; i-=2){
        datos_procesados.c.unshift(array_datos.c[i]);
        datos_procesados.o.unshift(array_datos.o[i-1]);
        datos_procesados.h.unshift((array_datos.h[i]>array_datos.h[i-1])? array_datos.h[i]:array_datos.h[i-1]);
        datos_procesados.l.unshift((array_datos.l[i]<array_datos.l[i-1])? array_datos.l[i]:array_datos.l[i-1]);
    }
    
    return datos_procesados;
}


function Media20 (data,position){
    let cierres = data.slice(position-20, position);
    return CalcularMedia(cierres);
}

function Media8 (data,position){
    let cierres = data.slice(position-8, position);
    return CalcularMedia(cierres);
}

function Media200 (data,position){
    let cierres = data.slice(position-200, position);
    return CalcularMedia(cierres);
}



function CalcularMedia (datos){
    let media = 0;

    for(let a of datos){
        media = media + a; 
    }
    return media/datos.length;
}

function Menor (array){
    let menor = array[0];

    for(let a of array){
        if(a<menor){
            menor=a;
        }
    }
    return menor;
}


function Mayor (array){
    let mayor = array[0];

    for(let a of array){
        if(a>mayor){
            mayor=a;
        }
    }
    return mayor;
}

function Compare(a, b) {
    if (a.parametros.promedio < b.parametros.promedio) {
      return -1;
    }
    if (a.parametros.promedio > b.parametros.promedio) {
      return 1;
    }
    // a debe ser igual b
    return 0;
  }

  function Compare20(a, b) {
    if (a.parametros.m200_m20 < b.parametros.m200_m20) {
      return -1;
    }
    if (a.parametros.m200_m20 > b.parametros.m200_m20) {
      return 1;
    }
    // a debe ser igual b
    return 0;
  }

  function CompareCA(a, b) {
    if (a.parametros.m200_CA < b.parametros.m200_CA) {
      return -1;
    }
    if (a.parametros.m200_CA > b.parametros.m200_CA) {
      return 1;
    }
    // a debe ser igual b
    return 0;
  }

function Delay(){
    
    //console.log("Iniciando pausa de la API");
    
    return new Promise(resolve => {
        setTimeout(function () {
            resolve("Continuando"); 
            }, 3000)
    });    
}


function Crear_Json(jugada){

    return new Promise(resolve => {
        fs.readFile('./Estadisticas/Json/Estadisticas_5min.json', 'utf8', function readFileCallback(err, data){
            if (err){
                console.log(err);
            } else {
            obj = JSON.parse(data); //now it an object
            obj.table.push(jugada); //add some data
            json = JSON.stringify(obj); //convert it back to json
            fs.writeFile('./Estadisticas/Json/Estadisticas_5min.json', json, 'utf8', ()=>{ resolve(console.log("hecho"))}); // write it back 
        }});
    });

}


// MM20(res.body.c,res.body.c.length-1) Media movil vela anterior a la en desarrollo pero es la que voy a usar para ver el patrón
// MM20(res.body.c,res.body.c.length-10) Media movil de -11 contando la que está en desarrollo 
// MM20(res.body.c,res.body.c.length-20) 


Inicio();






