const request = require('request');
var fs = require('fs');
const moment = require('moment');


async function Bucle (resolution){

    let array_acciones = ["AAPL","AMAT","AMD","C","CSCO","EBAY","GILD","INTC","KO","LVS","MET","MRK","MS","MU","ORCL","QCOM","SBUX","SNAP","TWTR","UAL","UBER","VZ","WFC","XOM"];

    let operaciones_encontradas = [];
    console.log("Comenzando a analizar los gráficos de "+resolution+" minutos");

    let array_promises = [];

    for(let accion of array_acciones){
        
        let operacion = Peticion(accion,resolution)
        array_promises.push(operacion);
        
    }


    let array_operaciones= [];
    await Promise.all(array_promises).then(values =>{
        
        for(let a of values){
            if(a.jugadas[0]){
                array_operaciones.push(a);
            }
        }
        console.log("Revisión de los gráficos de "+resolution+" completada");
    });

    for(let operacion of array_operaciones){
        for(let orden of operacion.jugadas){

           await Crear_Json(orden);

        }
    };

    return;
}



function Peticion(accion,resolution) {

    let now= new Date();
    let fecha= Math.round(now.getTime()/1000);
    let inicio = fecha - 500000;
    let operacion={
        divisas:accion,
        tiempo:resolution,
        jugadas:[]
    };
    return new Promise(resolve => {
                 
        request('https://finnhub.io/api/v1/stock/candle?symbol='+accion+'&resolution='+resolution+'&from='+inicio+'&to='+fecha+'&token=c2qih02ad3ickc1loc60', { json: true }, (err, res, body) => {
            if (err) { return reject(err); }
            
            let datos = Formatear(res.body);

            let elefante = VelaElefante(datos);
            if(elefante) {

                console.log("Vela elefante en "+accion);
                
                elefante.simbolo = operacion.divisas;
                elefante.fecha = new Date().toLocaleString();

                operacion.jugadas.push(elefante);

            };

            let VC = VelaCola(datos); 
            if(VC) {
                console.log("Vela de cola en "+ accion)
                VC.simbolo = operacion.divisas;
                VC.fecha = new Date().toLocaleString();
                operacion.jugadas.push(VC);
                
            };

            resolve(operacion);

        }); 
    });
};

async function Inicio(){
    
    let minutos_5= await Bucle(5);
    console.log("Inicializando en 5 minutos")

}





function VelaElefante (array_datos){

    if(!array_datos.h){
        console.log(array_datos);
    }

    let operacion={
        ru : 50
    };

    let high = array_datos.h[array_datos.h.length-1];
    let low = array_datos.l[array_datos.l.length-1];
    let close = array_datos.c[array_datos.c.length-1];
    let open = array_datos.o[array_datos.o.length-1];
    
    let rango = Math.abs(high - low);
    let cuerpo = Math.abs(open - close);

    let MM20_10 = Media20(array_datos.c,array_datos.c.length-9);

    let MM200 = Media200(array_datos.c,array_datos.c.length)


    if(close > open && cuerpo > (0.7 * rango) && close > MM200 && MM200 > MM20_10){

        operacion.jugada = "Vela Elefante";
        operacion.direccion = "largo";
        operacion.entrada = high;
        operacion.stop = low;
        operacion.riesgo = Math.round((high - low) * 100000) / 100000 ;
        operacion.lotes = Math.round((operacion.ru /operacion.riesgo) * 100000) / 100000;

        return operacion;
    }


    if(close < open && cuerpo > (0.7 * rango) && close < MM200 && MM200 < MM20_10){

        operacion.jugada = "Vela Elefante";
        operacion.direccion = "Corto";
        operacion.entrada = low;
        operacion.stop = high;
        operacion.riesgo = Math.round((high - low) * 100000) / 100000 ;
        operacion.lotes = Math.round((operacion.ru /operacion.riesgo) * 100000) / 100000;

        return operacion;
    }
        
    return false;
}



function VelaCola (array_datos){
    if(!array_datos.h){
        console.log(array_datos);
    }

    let operacion={
        ru : 50
    };

    let high = array_datos.h[array_datos.h.length-1];
    let low = array_datos.l[array_datos.l.length-1];
    let close = array_datos.c[array_datos.c.length-1];
    let open = array_datos.o[array_datos.o.length-1];
    
    let rango = Math.abs(high - low);
    let cuerpo = Math.abs(open - close);

    let MM20_10 = Media20(array_datos.c,array_datos.c.length-9);

    let MM200 = Media200(array_datos.c,array_datos.c.length)


    if(cuerpo < (0.3 * rango) && close > MM200 && MM200 > MM20_10 && open >= low + (0.6*rango) && close >= low + (0.6*rango)){

        operacion.jugada = "Vela Elefante";
        operacion.direccion = "largo";
        operacion.entrada = high;
        operacion.stop = low;
        operacion.riesgo = Math.round((high - low) * 100000) / 100000 ;
        operacion.lotes = Math.round((operacion.ru /operacion.riesgo) * 100000) / 100000;

        return operacion;
    }


    if(cuerpo < (0.3 * rango) && close < MM200 && MM200 < MM20_10 && open <= low + (0.4*rango) && close <= low + (0.4*rango)){

        operacion.jugada = "Vela Elefante";
        operacion.direccion = "Corto";
        operacion.entrada = low;
        operacion.stop = high;
        operacion.riesgo = Math.round((high - low) * 100000) / 100000 ;
        operacion.lotes = Math.round((operacion.ru /operacion.riesgo) * 100000) / 100000;

        return operacion;
    }
        
    return false;
}

function Formatear (array_datos){
    //console.log(array_datos);
    let datos_prodesados = {
        c:[],
        h:[],
        l:[],
        o:[],
        t:[]
    }

    for(i=0;i<array_datos.t.length; i++){
        let date = new Date(array_datos.t[i] * 1000).toISOString();
        let date2 = date.split("T")[0] + "T20:00:00.000Z";
        let date3 = date.split("T")[0] + "T13:25:00.000Z"


        if(moment(date).isBefore(date2) && moment(date).isAfter(date3)){
            datos_prodesados.c.push(array_datos.c[i]);
            datos_prodesados.h.push(array_datos.h[i]);
            datos_prodesados.l.push(array_datos.l[i]);
            datos_prodesados.o.push(array_datos.o[i]);
            datos_prodesados.t.push(array_datos.t[i]);
        }

    }
    return datos_prodesados;
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

function Crear_Json(jugada){

    return new Promise(resolve => {
        fs.readFile('./Estadisticas/Json/Estadisticas_VC5min.json', 'utf8', function readFileCallback(err, data){
            if (err){
                console.log(err);
            } else {
            obj = JSON.parse(data); //now it an object
            obj.table.push(jugada); //add some data
            json = JSON.stringify(obj); //convert it back to json
            fs.writeFile('./Estadisticas/Json/Estadisticas_VC5min.json', json, 'utf8', ()=>{ resolve(console.log("hecho"))}); // write it back 
        }});
    });

}


// MM20(res.body.c,res.body.c.length-1) Media movil vela anterior a la en desarrollo pero es la que voy a usar para ver el patrón
// MM20(res.body.c,res.body.c.length-10) Media movil de -11 contando la que está en desarrollo 
// MM20(res.body.c,res.body.c.length-20) 


Inicio();






