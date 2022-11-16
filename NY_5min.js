const request = require('request');
var fs = require('fs');
const moment = require('moment');
const { format } = require('path');
const { delay } = require('bluebird');


async function Bucle(resolution) {

    let array_acciones = ["AAPL", "BABA", "C", "CVX", "DIS", "EBAY", "META", "GILD", "GLD", "IWM", "KO", "LVS", "MET", "NKE", "NUGT", "PYPL", "QCOM", "UAL", "VZ", "JPM", "MS", "MRK", "MU", "ORCL", "SBUX", "SPXL", "UBER", "WMT", "WYNN", "AMZN", "JNJ", "PG", "IBM", "NIO", "XLE", "X", "GE", "WBA", "AAL", "BAC", "GM", "DD", "COP", "ABBV", "BMY", "GOOG", "NEE", "NVDA", "WDC", "XLF", "SHOP", "ATVI", "CVS", "TMUS", "MDT", "FISV", "PM", "PEP", "EWZ", "FXI"];
    // -- ,"MDT","FISV","PM" -- FCX, CLF, MTCH, PFE, ARKK, CMCSA
    console.log(array_acciones.length)
    let operaciones_encontradas = [];
    console.log("Comenzando a analizar los gráficos de " + resolution + " minutos");


    let array_promises = [];

    let i = 0;

    for (let accion of array_acciones) {

        let operacion = Peticion(accion, resolution)
        array_promises.push(operacion);
        // if(operacion.jugadas[0]){
        //     operaciones_encontradas.push(operacion.divisas.replace("_",""))

        //     console.log("****");
        //     console.log("****");
        //     console.log(new Date().toLocaleString())

        //     for(let jugada of operacion.jugadas){

        //         jugada.simbolo = operacion.divisas;
        //         jugada.fecha = new Date().toLocaleString();

        //         console.log("Posible configuranción en "+operacion.divisas+" en  "+operacion.tiempo+" minutos"+" "+jugada.jugada);

        //         //await Crear_Json(jugada);
        //     }


        //     console.log("Símbolo: "+ operacion.divisas.replace("_",""))
        //     console.log("Jugada: "+ operacion.jugadas[0].jugada);
        //     console.log("Dirección: "+operacion.jugadas[0].direccion);
        //     console.log("Entrada: "+operacion.jugadas[0].entrada);
        //     console.log("Stop: "+operacion.jugadas[0].stop);
        //     console.log("Riesgo: "+operacion.jugadas[0].riesgo);
        //     console.log("Lotes: "+operacion.jugadas[0].lotes);


        // }

        if (i == 10) {

            await Delay();
            i = 0;
        }

        i++;

    }
    let array_operaciones = [];
    await Promise.all(array_promises).then(values => {

        for (let a of values) {
            if (a.jugadas[0]) {
                array_operaciones.push(a);
            }
        }
        console.log("Revisión de los gráficos de " + resolution + " completada");
    })


    for (let operacion of array_operaciones) {
        for (let orden of operacion.jugadas) {

            await Crear_Json(orden);

        }
    }

    return;
}



function Peticion(accion, resolution) {

    let now = new Date();
    let fecha = Math.round(now.getTime() / 1000);
    let inicio = fecha - 360000 * resolution;
    let operacion = {
        divisas: accion,
        tiempo: resolution,
        jugadas: []
    };
    return new Promise(resolve => {

        request('https://finnhub.io/api/v1/indicator?symbol=' + accion + '&resolution=' + resolution + '&from=' + inicio + '&to=' + fecha + '&indicator=ADX&timeperiod=14&token=c2mb3fqad3idu4ahvsh0', { json: true }, (err, res, body) => {
            if (err) { return reject(err); }

            let datos = Formatear(res.body);

            let vbs = VBSADX(datos);

            let vri_apertura = VRI_Apertura(datos);

            // let regalo = Regalo(datos);

            // if(!vbs){
            //     vbs=VBS2(datos);
            // }

            if (vbs) {
                console.log("VBS en " + accion)
                vbs.simbolo = operacion.divisas;
                vbs.fecha = new Date().toLocaleString();
                operacion.jugadas.push(vbs);
            };


            if (vri_apertura) {
                console.log("VRI en " + accion)
                vbs.simbolo = operacion.divisas;
                vbs.fecha = new Date().toLocaleString();
                operacion.jugadas.push(vbs);
            }

            // if(regalo){
            //     console.log("Jugada de regalo en " + accion);
            //     regalo.simbolo = operacion.divisas
            //     regalo.fecha = new Date().toLocaleString();
            //     operacion.jugadas.push(regalo);
            // }

            // let VC = VelaCola(datos); 
            // if(VC) {
            //     console.log("Vela de cola en "+ accion)
            //     VC.simbolo = operacion.divisas;
            //     VC.fecha = new Date().toLocaleString();
            //     operacion.jugadas.push(VC);

            // };




            resolve(operacion);

        });
    });
};

async function Inicio() {

    let minutos_5 = Bucle(5);
    console.log("Inicializando en 5 minutos")
    setInterval(function () {
        Bucle(5)
    }, 300000);
}



function VBSADX(array_datos) {

    if (!array_datos.h) {
        console.log(array_datos);
    }

    let operacion = {
        ru: 50
    };

    let high = array_datos.h[array_datos.h.length - 1];
    let high_1 = array_datos.h[array_datos.h.length - 2];
    let high_2 = array_datos.h[array_datos.h.length - 3];

    let low = array_datos.l[array_datos.l.length - 1];
    let low_1 = array_datos.l[array_datos.l.length - 2];
    let low_2 = array_datos.l[array_datos.l.length - 3];

    let MM20 = Media20(array_datos.c, array_datos.c.length);
    let MM20_10 = Media20(array_datos.c, array_datos.c.length - 4);
    let MM20_20 = Media20(array_datos.c, array_datos.c.length - 9);

    let MM8 = Media8(array_datos.c, array_datos.c.length);
    let MM8_3 = Media8(array_datos.c, array_datos.c.length - 4);
    let MM8_5 = Media8(array_datos.c, array_datos.c.length - 9);

    let adx = array_datos.adx[array_datos.adx.length - 1];

    if (MM20 > MM20_10 && MM20_10 > MM20_20 && MM8 > MM8_3 && MM8_3 > MM8_5 && high < high_1 && high_1 < high_2 && adx >= 20 && adx <= 50) {

        operacion.jugada = "VBS_ADX";
        operacion.direccion = "largo";
        operacion.entrada = high;
        operacion.stop = low;
        operacion.riesgo = Math.round((high - low) * 100000) / 100000;
        operacion.lotes = Math.round((operacion.ru / operacion.riesgo) * 100000) / 100000;

        return operacion;

    }


    if (MM20 < MM20_10 && MM20_10 < MM20_20 && MM8 < MM8_3 && MM8_3 < MM8_5 && low > low_1 && low_1 > low_2 && adx >= 20 && adx <= 40) {

        operacion.jugada = "VBS_ADX";
        operacion.direccion = "Corto";
        operacion.entrada = low;
        operacion.stop = high;
        operacion.riesgo = Math.round((high - low) * 100000) / 100000;
        operacion.lotes = Math.round((operacion.ru / operacion.riesgo) * 100000) / 100000;

        return operacion;
    }

    return false;

}



function Regalo(array_datos) {

    if (!array_datos.h) {
        console.log(array_datos);
    }

    let operacion = {
        ru: 50
    };

    let high = array_datos.h[array_datos.h.length - 1];
    let high_1 = array_datos.h[array_datos.h.length - 2];
    let high_2 = array_datos.h[array_datos.h.length - 3];

    let low = array_datos.l[array_datos.l.length - 1];
    let low_1 = array_datos.l[array_datos.l.length - 2];
    let low_2 = array_datos.l[array_datos.l.length - 3];

    let open = array_datos.o[array_datos.l.length - 1];
    let open_1 = array_datos.o[array_datos.l.length - 2];
    let open_2 = array_datos.o[array_datos.l.length - 3];

    let close = array_datos.c[array_datos.l.length - 1];
    let close_1 = array_datos.c[array_datos.l.length - 2];
    let close_2 = array_datos.c[array_datos.l.length - 3];


    if (open_2 < close_2 && close_2 > (high_2 - ((high_2 - low_2) / 3)) && high_1 < (high_2 + ((high_2 - low_2) / 3)) && (high < high_1) && low_1 > low_2 && low > low_2) {

        operacion.jugada = "Jugada de regalo";
        operacion.direccion = "largo";
        operacion.entrada = high;
        operacion.stop = low;
        operacion.riesgo = Math.round((high - low) * 100000) / 100000;
        operacion.lotes = Math.round((operacion.ru / operacion.riesgo) * 100000) / 100000;

        return operacion;

    }


    if (open_2 > close_2 && close_2 < (low_2 + ((high_2 - low_2) / 3)) && low_1 > (low_2 - ((high_2 - low_2) / 3)) && (low < low_1) && high_1 < high_2 && high < high_2) {

        operacion.jugada = "Jugada de regalo";
        operacion.direccion = "Corto";
        operacion.entrada = low;
        operacion.stop = high;
        operacion.riesgo = Math.round((high - low) * 100000) / 100000;
        operacion.lotes = Math.round((operacion.ru / operacion.riesgo) * 100000) / 100000;

        return operacion;

    }

    return false;

}




function VBS1(array_datos) {

    if (!array_datos.h) {
        console.log(array_datos);
    }

    let operacion = {
        ru: 50
    };

    let high = array_datos.h[array_datos.h.length - 1];
    let high_1 = array_datos.h[array_datos.h.length - 2];
    let high_2 = array_datos.h[array_datos.h.length - 3];

    let low = array_datos.l[array_datos.l.length - 1];
    let low_1 = array_datos.l[array_datos.l.length - 2];
    let low_2 = array_datos.l[array_datos.l.length - 3];

    let MM20 = Media20(array_datos.c, array_datos.c.length);
    let MM20_10 = Media20(array_datos.c, array_datos.c.length - 9);
    let MM20_20 = Media20(array_datos.c, array_datos.c.length - 19);

    let MM8 = Media8(array_datos.c, array_datos.c.length);
    let MM8_10 = Media8(array_datos.c, array_datos.c.length - 9);
    let MM8_20 = Media8(array_datos.c, array_datos.c.length - 19);


    if (MM20 > MM20_10 && MM20_10 > MM20_20 && MM8 > MM8_10 && MM8_10 > MM8_20 && high < high_1 && high_1 < high_2) {

        operacion.jugada = "VBS1";
        operacion.direccion = "largo";
        operacion.entrada = high;
        operacion.stop = low;
        operacion.riesgo = Math.round((high - low) * 100000) / 100000;
        operacion.lotes = Math.round((operacion.ru / operacion.riesgo) * 100000) / 100000;

        return operacion;

    }


    if (MM20 < MM20_10 && MM20_10 < MM20_20 && MM8 < MM8_10 && MM8_10 < MM8_20 && low > low_1 && low_1 > low_2) {

        operacion.jugada = "VBS1";
        operacion.direccion = "Corto";
        operacion.entrada = low;
        operacion.stop = high;
        operacion.riesgo = Math.round((high - low) * 100000) / 100000;
        operacion.lotes = Math.round((operacion.ru / operacion.riesgo) * 100000) / 100000;

        return operacion;
    }

    return false;

}



function VBS3(array_datos) {

    if (!array_datos.h) {
        console.log(array_datos);
    }

    let operacion = {
        ru: 50
    };

    let high = array_datos.h[array_datos.h.length - 1];
    let high_1 = array_datos.h[array_datos.h.length - 2];
    let high_2 = array_datos.h[array_datos.h.length - 3];

    let low = array_datos.l[array_datos.l.length - 1];
    let low_1 = array_datos.l[array_datos.l.length - 2];
    let low_2 = array_datos.l[array_datos.l.length - 3];

    let MM20 = Media20(array_datos.c, array_datos.c.length);
    let MM20_10 = Media20(array_datos.c, array_datos.c.length - 9);
    let MM20_20 = Media20(array_datos.c, array_datos.c.length - 19);

    let MM8 = Media8(array_datos.c, array_datos.c.length);
    let MM8_3 = Media8(array_datos.c, array_datos.c.length - 2);
    let MM8_5 = Media8(array_datos.c, array_datos.c.length - 4);


    if (MM20 > MM20_10 && MM20_10 > MM20_20 && MM8 > MM8_3 && MM8_3 > MM8_5 && high < high_1 && high_1 < high_2 && low <= MM8 && high >= MM20) {

        operacion.jugada = "VBS3";
        operacion.direccion = "largo";
        operacion.entrada = high;
        operacion.stop = low;
        operacion.riesgo = Math.round((high - low) * 100000) / 100000;
        operacion.lotes = Math.round((operacion.ru / operacion.riesgo) * 100000) / 100000;

        return operacion;

    }


    if (MM20 < MM20_10 && MM20_10 < MM20_20 && MM8 < MM8_3 && MM8_3 < MM8_5 && low > low_1 && low_1 > low_2 && high >= MM8 && low <= MM20) {

        operacion.jugada = "VBS3";
        operacion.direccion = "Corto";
        operacion.entrada = low;
        operacion.stop = high;
        operacion.riesgo = Math.round((high - low) * 100000) / 100000;
        operacion.lotes = Math.round((operacion.ru / operacion.riesgo) * 100000) / 100000;

        return operacion;
    }

    return false;

}



function VBS2(array_datos) {

    if (!array_datos.h) {
        console.log(array_datos);
    }

    let operacion = {
        ru: 50
    };

    let high = array_datos.h[array_datos.h.length - 1];
    let high_1 = array_datos.h[array_datos.h.length - 2];
    let high_2 = array_datos.h[array_datos.h.length - 3];

    let low = array_datos.l[array_datos.l.length - 1];
    let low_1 = array_datos.l[array_datos.l.length - 2];
    let low_2 = array_datos.l[array_datos.l.length - 3];


    let MM20 = Media20(array_datos.c, array_datos.c.length);
    let MM20_10 = Media20(array_datos.c, array_datos.c.length - 4);
    let MM20_20 = Media20(array_datos.c, array_datos.c.length - 9);

    let MM8 = Media8(array_datos.c, array_datos.c.length);
    let MM8_10 = Media8(array_datos.c, array_datos.c.length - 4);
    let MM8_20 = Media8(array_datos.c, array_datos.c.length - 9);


    if (MM20 > MM20_10 && MM20_10 > MM20_20 && MM8 > MM8_10 && MM8_10 > MM8_20 && high < high_1 && high_1 < high_2) {

        operacion.jugada = "VBS2";
        operacion.direccion = "largo";
        operacion.entrada = high;
        operacion.stop = low;
        operacion.riesgo = Math.round((high - low) * 100000) / 100000;
        operacion.lotes = Math.round((operacion.ru / operacion.riesgo) * 100000) / 100000;

        return operacion;

    }

    if (MM20 < MM20_10 && MM20_10 < MM20_20 && MM8 < MM8_10 && MM8_10 < MM8_20 && low > low_1 && low_1 > low_2) {

        operacion.jugada = "VBS2";
        operacion.direccion = "Corto";
        operacion.entrada = low;
        operacion.stop = high;
        operacion.riesgo = Math.round((high - low) * 100000) / 100000;
        operacion.lotes = Math.round((operacion.ru / operacion.riesgo) * 100000) / 100000;

        return operacion;

    }

    return false;

}

function VelaCola(array_datos) {
    if (!array_datos.h) {
        console.log(array_datos);
    }

    let operacion = {
        ru: 50
    };

    let high = array_datos.h[array_datos.h.length - 1];
    let high_1 = array_datos.h[array_datos.h.length - 2];
    let high_2 = array_datos.h[array_datos.h.length - 3];


    let low = array_datos.l[array_datos.l.length - 1];
    let low_1 = array_datos.l[array_datos.l.length - 2];
    let low_2 = array_datos.l[array_datos.l.length - 3];


    let close = array_datos.c[array_datos.c.length - 1];
    let open = array_datos.o[array_datos.o.length - 1];

    let rango = Math.abs(high - low);
    let cuerpo = Math.abs(open - close);

    let MM20 = Media20(array_datos.c, array_datos.c.length);
    let MM20_10 = Media20(array_datos.c, array_datos.c.length - 9);
    let MM20_20 = Media20(array_datos.c, array_datos.c.length - 19);



    if (MM20 <= high && MM20 >= low && MM20 > MM20_10 && MM20_10 > MM20_20 && cuerpo < (0.3 * rango) && high_1 > MM20 && high_2 > MM20) {

        operacion.jugada = "Vela de cola";
        operacion.direccion = "largo";
        operacion.entrada = high;
        operacion.stop = low;
        operacion.riesgo = Math.round((high - low) * 100000) / 100000;
        operacion.lotes = Math.round((operacion.ru / operacion.riesgo) * 100000) / 100000;

        return operacion;
    }


    if (MM20 <= high && MM20 >= low && MM20 < MM20_10 && MM20_10 < MM20_20 && cuerpo < (0.3 * rango) && low_1 < MM20 && low_2 < MM20) {

        operacion.jugada = "Vela de cola";
        operacion.direccion = "Corto";
        operacion.entrada = low;
        operacion.stop = high;
        operacion.riesgo = Math.round((high - low) * 100000) / 100000;
        operacion.lotes = Math.round((operacion.ru / operacion.riesgo) * 100000) / 100000;

        return operacion;
    }

    return false;
}


function NBR(array_datos) {
    if (!array_datos.h) {
        console.log(array_datos);
    }

    let operacion = {
        ru: 50
    };

    let high = array_datos.h[array_datos.h.length - 1];
    let high_2 = array_datos.h[array_datos.h.length - 2];
    let high_3 = array_datos.h[array_datos.h.length - 3];
    let high_4 = array_datos.h[array_datos.h.length - 4];
    let high_5 = array_datos.h[array_datos.h.length - 5];

    let low = array_datos.l[array_datos.l.length - 1];
    let low_2 = array_datos.l[array_datos.l.length - 2];
    let low_3 = array_datos.l[array_datos.l.length - 3];
    let low_4 = array_datos.l[array_datos.l.length - 4];
    let low_5 = array_datos.l[array_datos.l.length - 5];


    let close = array_datos.c[array_datos.c.length - 1];
    let close_2 = array_datos.c[array_datos.c.length - 2];
    let close_3 = array_datos.c[array_datos.c.length - 3];
    let close_4 = array_datos.c[array_datos.c.length - 4];
    let close_5 = array_datos.c[array_datos.c.length - 5];

    let open = array_datos.o[array_datos.o.length - 1];
    let open_2 = array_datos.o[array_datos.o.length - 2];
    let open_3 = array_datos.o[array_datos.o.length - 3];
    let open_4 = array_datos.o[array_datos.o.length - 4];
    let open_5 = array_datos.o[array_datos.o.length - 5];

    let MM200 = Media200(array_datos.c, array_datos.c.length)
    let MM20 = Media20(array_datos.c, array_datos.c.length);
    // let rango = Math.abs(high - low);
    // let rango_2 = Math.abs(high_2 - low_2);
    // let rango_3 = Math.abs(high_3 - low_3);
    // let rango_4 = Math.abs(high_4 - low_4);
    // let rango_5 = Math.abs(high_5 - low_5);
    // rango == Menor([rango,rango_2,rango_3,rango_4,rango_5])


    if (close_5 < open_5 && close_4 < open_4 && close_3 < open_3 && close_2 < open_2 && close < open && ((high >= MM200 && low <= MM200) || (high >= MM20 && low <= MM20))) {

        operacion.jugada = "NBR";
        operacion.direccion = "Largo";
        operacion.entrada = high;
        operacion.stop = low;
        operacion.riesgo = Math.round((high - low) * 100000) / 100000;
        operacion.lotes = Math.round((operacion.ru / operacion.riesgo) * 100000) / 100000;

        return operacion;
    }


    if (close_5 > open_5 && close_4 > open_4 && close_3 > open_3 && close_2 > open_2 && close > open && ((high >= MM200 && low <= MM200) || (high >= MM20 && low <= MM20))) {

        operacion.jugada = "NBR";
        operacion.direccion = "Corto";
        operacion.entrada = low;
        operacion.stop = high;
        operacion.riesgo = Math.round((high - low) * 100000) / 100000;
        operacion.lotes = Math.round((operacion.ru / operacion.riesgo) * 100000) / 100000;

        return operacion;
    }

    return false;
}



function VelaElefante(array_datos) {

    if (!array_datos.h) {
        console.log(array_datos);
    }

    let operacion = {
        ru: 50
    };

    let high = array_datos.h[array_datos.h.length - 1];
    let low = array_datos.l[array_datos.l.length - 1];
    let close = array_datos.c[array_datos.c.length - 1];
    let open = array_datos.o[array_datos.o.length - 1];

    let high_2 = array_datos.h[array_datos.h.length - 2];
    let high_3 = array_datos.h[array_datos.h.length - 3];
    let high_4 = array_datos.h[array_datos.h.length - 4];
    let high_5 = array_datos.h[array_datos.h.length - 5];
    let high_6 = array_datos.h[array_datos.h.length - 6];
    let high_7 = array_datos.h[array_datos.h.length - 7];
    let high_8 = array_datos.h[array_datos.h.length - 8];
    let high_9 = array_datos.h[array_datos.h.length - 9];
    let high_10 = array_datos.h[array_datos.h.length - 10];
    let high_11 = array_datos.h[array_datos.h.length - 11];

    let max = Mayor([high_2, high_3, high_4, high_5, high_6, high_7, high_8, high_9, high_10, high_11]);

    let low_2 = array_datos.l[array_datos.l.length - 2];
    let low_3 = array_datos.l[array_datos.l.length - 3];
    let low_4 = array_datos.l[array_datos.l.length - 4];
    let low_5 = array_datos.l[array_datos.l.length - 5];
    let low_6 = array_datos.l[array_datos.l.length - 6];
    let low_7 = array_datos.l[array_datos.l.length - 7];
    let low_8 = array_datos.l[array_datos.l.length - 8];
    let low_9 = array_datos.l[array_datos.l.length - 9];
    let low_10 = array_datos.l[array_datos.l.length - 10];
    let low_11 = array_datos.l[array_datos.l.length - 11];

    let min = Menor([low_2, low_3, low_4, low_5, low_6, low_7, low_8, low_9, low_10, low_11]);

    let rango = Math.abs(high - low);
    let cuerpo = Math.abs(open - close);

    let MM20_10 = Media20(array_datos.c, array_datos.c.length - 9);

    let MM200 = Media200(array_datos.c, array_datos.c.length)


    if (close > open && cuerpo > (0.7 * rango) && close > MM200 && MM200 > MM20_10 && high >= max && low <= MM200) {

        operacion.jugada = "Vela Elefante";
        operacion.direccion = "largo";
        operacion.entrada = high;
        operacion.stop = low;
        operacion.riesgo = Math.round((high - low) * 100000) / 100000;
        operacion.lotes = Math.round((operacion.ru / operacion.riesgo) * 100000) / 100000;
        operacion.mm200 = MM200;

        return operacion;
    }


    if (close < open && cuerpo > (0.7 * rango) && close < MM200 && MM200 < MM20_10 && low <= min && high >= MM200) {

        operacion.jugada = "Vela Elefante";
        operacion.direccion = "Corto";
        operacion.entrada = low;
        operacion.stop = high;
        operacion.riesgo = Math.round((high - low) * 100000) / 100000;
        operacion.lotes = Math.round((operacion.ru / operacion.riesgo) * 100000) / 100000;
        operacion.mm200 = MM200;

        return operacion;
    }

    return false;
}


function VRI(array_datos) {

    if (!array_datos.h) {
        console.log(array_datos);
    }

    let operacion = {
        ru: 50
    };

    let high = array_datos.h[array_datos.h.length - 1];
    let low = array_datos.l[array_datos.l.length - 1];
    let close = array_datos.c[array_datos.c.length - 1];
    let open = array_datos.o[array_datos.o.length - 1];

    let rango = Math.abs(high - low);


    let high_1 = array_datos.h[array_datos.h.length - 2];
    let low_1 = array_datos.l[array_datos.l.length - 2];
    let close_1 = array_datos.c[array_datos.c.length - 2];
    let open_1 = array_datos.o[array_datos.o.length - 2];

    // let high_2 = array_datos.h[array_datos.h.length-2];
    // let high_3 = array_datos.h[array_datos.h.length-3];
    // let high_4 = array_datos.h[array_datos.h.length-4];
    // let high_5 = array_datos.h[array_datos.h.length-5];
    // let high_6 = array_datos.h[array_datos.h.length-6];
    // let high_7 = array_datos.h[array_datos.h.length-7];
    // let high_8 = array_datos.h[array_datos.h.length-8];
    // let high_9 = array_datos.h[array_datos.h.length-9];
    // let high_10 = array_datos.h[array_datos.h.length-10];
    // let high_11 = array_datos.h[array_datos.h.length-11];

    // let max = Mayor([high_2,high_3,high_4,high_5,high_6,high_7,high_8,high_9,high_10,high_11]);

    // let low_2 = array_datos.l[array_datos.l.length-2];
    // let low_3 = array_datos.l[array_datos.l.length-3];
    // let low_4 = array_datos.l[array_datos.l.length-4];
    // let low_5 = array_datos.l[array_datos.l.length-5];
    // let low_6 = array_datos.l[array_datos.l.length-6];
    // let low_7 = array_datos.l[array_datos.l.length-7];
    // let low_8 = array_datos.l[array_datos.l.length-8];
    // let low_9 = array_datos.l[array_datos.l.length-9];
    // let low_10 = array_datos.l[array_datos.l.length-10];
    // let low_11 = array_datos.l[array_datos.l.length-11];

    // let min = Menor([low_2,low_3,low_4,low_5,low_6,low_7,low_8,low_9,low_10,low_11]);

    let cuerpo_3 = array_datos.h[array_datos.h.length - 3] - array_datos.l[array_datos.l.length - 3];
    let cuerpo_4 = array_datos.h[array_datos.h.length - 4] - array_datos.l[array_datos.l.length - 4];
    let cuerpo_5 = array_datos.h[array_datos.h.length - 5] - array_datos.l[array_datos.l.length - 5];
    let cuerpo_6 = array_datos.h[array_datos.h.length - 6] - array_datos.l[array_datos.l.length - 6];
    let cuerpo_7 = array_datos.h[array_datos.h.length - 7] - array_datos.l[array_datos.l.length - 7];
    let cuerpo_8 = array_datos.h[array_datos.h.length - 8] - array_datos.l[array_datos.l.length - 8];
    let cuerpo_9 = array_datos.h[array_datos.h.length - 9] - array_datos.l[array_datos.l.length - 9];
    let cuerpo_10 = array_datos.h[array_datos.h.length - 10] - array_datos.l[array_datos.l.length - 10];
    let cuerpo_11 = array_datos.h[array_datos.h.length - 11] - array_datos.l[array_datos.l.length - 11];
    let cuerpo_12 = array_datos.h[array_datos.h.length - 12] - array_datos.l[array_datos.l.length - 12];

    let mayor = Mayor([cuerpo_3], [cuerpo_4], [cuerpo_5], [cuerpo_6], [cuerpo_7], [cuerpo_8], [cuerpo_9], [cuerpo_10], [cuerpo_11], [cuerpo_12]);

    let rango_1 = Math.abs(high_1 - low_1);
    let cuerpo_1 = Math.abs(open_1 - close_1);


    if (close_1 > open_1 && cuerpo_1 > (0.7 * rango_1) && rango_1 >= mayor && rango < (rango_1 * 0.5)) {

        operacion.jugada = "VRI";
        operacion.direccion = "largo";
        operacion.entrada = high;
        operacion.stop = low;
        operacion.riesgo = Math.round((high - low) * 100000) / 100000;
        operacion.lotes = Math.round((operacion.ru / operacion.riesgo) * 100000) / 100000;

        return operacion;
    }


    if (close_1 < open_1 && cuerpo_1 > (0.7 * rango_1) && rango_1 >= mayor && rango < (rango_1 * 0.5)) {

        operacion.jugada = "VRI";
        operacion.direccion = "Corto";
        operacion.entrada = low;
        operacion.stop = high;
        operacion.riesgo = Math.round((high - low) * 100000) / 100000;
        operacion.lotes = Math.round((operacion.ru / operacion.riesgo) * 100000) / 100000;

        return operacion;
    }

    return false;
}


function Reversa(array_datos) {

    if (!array_datos.h) {
        console.log(array_datos);
    }

    let operacion = {
        ru: 50
    };

    let high = array_datos.h[array_datos.h.length - 1];
    let low = array_datos.l[array_datos.l.length - 1];
    let close = array_datos.c[array_datos.c.length - 1];
    let open = array_datos.o[array_datos.o.length - 1];

    let high_2 = array_datos.h[array_datos.h.length - 2];
    let high_3 = array_datos.h[array_datos.h.length - 3];
    let high_4 = array_datos.h[array_datos.h.length - 4];
    let high_5 = array_datos.h[array_datos.h.length - 5];
    let high_6 = array_datos.h[array_datos.h.length - 6];
    let high_7 = array_datos.h[array_datos.h.length - 7];
    let high_8 = array_datos.h[array_datos.h.length - 8];
    let high_9 = array_datos.h[array_datos.h.length - 9];
    let high_10 = array_datos.h[array_datos.h.length - 10];
    let high_11 = array_datos.h[array_datos.h.length - 11];


    let low_2 = array_datos.l[array_datos.l.length - 2];
    let low_3 = array_datos.l[array_datos.l.length - 3];
    let low_4 = array_datos.l[array_datos.l.length - 4];
    let low_5 = array_datos.l[array_datos.l.length - 5];
    let low_6 = array_datos.l[array_datos.l.length - 6];
    let low_7 = array_datos.l[array_datos.l.length - 7];
    let low_8 = array_datos.l[array_datos.l.length - 8];
    let low_9 = array_datos.l[array_datos.l.length - 9];
    let low_10 = array_datos.l[array_datos.l.length - 10];
    let low_11 = array_datos.l[array_datos.l.length - 11];



    let open_2 = array_datos.o[array_datos.o.length - 2];
    let open_3 = array_datos.o[array_datos.o.length - 3];
    let open_4 = array_datos.o[array_datos.o.length - 4];
    let open_5 = array_datos.o[array_datos.o.length - 5];
    let open_6 = array_datos.o[array_datos.o.length - 6];
    let open_7 = array_datos.o[array_datos.o.length - 7];
    let open_8 = array_datos.o[array_datos.o.length - 8];
    let open_9 = array_datos.o[array_datos.o.length - 9];
    let open_10 = array_datos.o[array_datos.o.length - 10];



    let close_2 = array_datos.c[array_datos.c.length - 2];
    let close_3 = array_datos.c[array_datos.c.length - 3];
    let close_4 = array_datos.c[array_datos.c.length - 4];
    let close_5 = array_datos.c[array_datos.c.length - 5];
    let close_6 = array_datos.c[array_datos.c.length - 6];
    let close_7 = array_datos.c[array_datos.c.length - 7];
    let close_8 = array_datos.c[array_datos.c.length - 8];
    let close_9 = array_datos.c[array_datos.c.length - 9];
    let close_10 = array_datos.c[array_datos.c.length - 10];



    if ((close_10 < open_10 || high_11 > high_10) && (close_9 < open_9 || high_10 > high_9) && (close_8 < open_8 || high_9 > high_8) && (close_7 < open_7 || high_8 > high_7) && (close_6 < open_6 || high_7 > high_6) && (close_5 < open_5 || high_6 > high_5) && (close_4 < open_4 || high_5 > high_4) && (close_3 < open_3 || high_4 > high_3) && (close_2 < open_2 || high_3 > high_2) && (close < open || high_2 > high)) {

        operacion.jugada = "Reversa";
        operacion.direccion = "largo";
        operacion.entrada = high;
        operacion.stop = low;
        operacion.riesgo = Math.round((high - low) * 100000) / 100000;
        operacion.lotes = Math.round((operacion.ru / operacion.riesgo) * 100000) / 100000;

        return operacion;
    }


    if ((close_10 > open_10 || low_11 < low_10) && (close_9 > open_9 || low_10 < low_9) && (close_8 > open_8 || low_9 < low_8) && (close_7 > open_7 || low_8 < low_7) && (close_6 > open_6 || low_7 < low_6) && (close_5 > open_5 || low_6 < low_5) && (close_4 > open_4 || low_5 < low_4) && (close_3 > open_3 || low_4 < low_3) && (close_2 > open_2 || low_3 < low_2) && (close > open || low_2 < low)) {

        operacion.jugada = "Reversa";
        operacion.direccion = "Corto";
        operacion.entrada = low;
        operacion.stop = high;
        operacion.riesgo = Math.round((high - low) * 100000) / 100000;
        operacion.lotes = Math.round((operacion.ru / operacion.riesgo) * 100000) / 100000;

        return operacion;
    }

    return false;
}


//Solo entre las 15:30 y 17:15
//Una primera vela sólida apertura en 25% del bajo y cierre en el 25% alto para los toros
//La siguiente vela permanece en el tercio superior (puediendo rebasar el alto en un 20% como máximo)
//Unos resultados realmente interesantes, la voy a seguir estudiando en vivo y viendo cómo podría mejorarla
//
function VRI_Apertura(array_datos) {
    if (!array_datos.h) {
        console.log(array_datos);
    }

    let operacion = {
        ru: 50
    };


    //Obtengo la fecha y hora para saber si aún debo ejecutar este script
    let date = new Date(array_datos.t[array_datos.t.length - 1] * 1000).toISOString();

    let hora_fin = "T16:46:00.000Z";
    let hora_inicio = "T14:28:00.000Z"


    let date2 = date.split("T")[0] + hora_fin;
    let date3 = date.split("T")[0] + hora_inicio;

    if (moment(date).isBefore(date2) && moment(date).isAfter(date3)) {
        //Obtengo los datos de las tres velas anteriores
        let high = array_datos.h[array_datos.h.length - 1];
        let high_1 = array_datos.h[array_datos.h.length - 2];

        let low = array_datos.l[array_datos.l.length - 1];
        let low_1 = array_datos.l[array_datos.l.length - 2];

        let close = array_datos.c[array_datos.c.length - 1];
        let close_1 = array_datos.c[array_datos.c.length - 2];

        let open = array_datos.o[array_datos.o.length - 1];
        let open_1 = array_datos.o[array_datos.o.length - 2];

        let rango_1 = high_1 - low_1

        let mm20 = Media20(array_datos.c, array_datos.c.length - 1)



        if (open_1 <= low_1 + (0.25 * rango_1) && close_1 >= high_1 - (0.25 * rango_1) && high < high_1 + (rango_1 * 0.2) && low > high_1 - (rango_1 * 0.4)) {

            operacion.jugada = "VRI";
            operacion.direccion = "largo";
            operacion.entrada = high;
            operacion.stop = low;
            operacion.riesgo = Math.round((high - low) * 100000) / 100000;
            operacion.lotes = Math.round((operacion.ru / operacion.riesgo) * 100000) / 100000;

            return operacion;
        }

        if (open_1 >= high_1 - (0.25 * rango_1) && close_1 <= low_1 + (0.25 * rango_1) && low > low_1 - (rango_1 * 0.2) && high < low_1 + (rango_1 * 0.4)) {

            operacion.jugada = "VRI";
            operacion.direccion = "Corto";
            operacion.entrada = low;
            operacion.stop = high;
            operacion.riesgo = Math.round((high - low) * 100000) / 100000;
            operacion.lotes = Math.round((operacion.ru / operacion.riesgo) * 100000) / 100000;

            return operacion;
        }
    };

    return false;
}



function Formatear(array_datos) {
    //console.log(array_datos);
    let datos_procesados = {
        c: [],
        h: [],
        l: [],
        o: [],
        t: [],
        adx: []
    }
    if (!array_datos.t) {
        console.log(array_datos);
    }

    for (i = 0; i < array_datos.t.length; i++) {
        let date = new Date(array_datos.t[i] * 1000).toISOString();
        let date2 = date.split("T")[0] + "T20:00:00.000Z";
        let date3 = date.split("T")[0] + "T14:25:00.000Z"


        if (moment(date).isBefore(date2) && moment(date).isAfter(date3)) {
            
            datos_procesados.c.push(array_datos.c[i]);
            datos_procesados.h.push(array_datos.h[i]);
            datos_procesados.l.push(array_datos.l[i]);
            datos_procesados.o.push(array_datos.o[i]);
            datos_procesados.t.push(array_datos.t[i]);
            datos_procesados.adx.push(array_datos.adx[i]);

        }

    }

    return datos_procesados;
}

function Delay() {

    //console.log("Iniciando pausa de la API");

    return new Promise(resolve => {
        setTimeout(function () {
            resolve("Continuando");
        }, 3000)
    });
}


function Media20(data, position) {
    let cierres = data.slice(position - 19, position + 1);
    return CalcularMedia(cierres);
}

function Media8(data, position) {
    let cierres = data.slice(position - 7, position + 1);
    return CalcularMedia(cierres);
}

function Media200(data, position) {
    let cierres = data.slice(position - 199, position + 1);
    return CalcularMedia(cierres);
}



function CalcularMedia(datos) {
    let media = 0;

    for (let a of datos) {
        media = media + a;
    }
    return media / datos.length;
}

function Menor(array) {
    let menor = array[0];

    for (let a of array) {
        if (a < menor) {
            menor = a;
        }
    }
    return menor;
}


function Mayor(array) {
    let mayor = array[0];

    for (let a of array) {
        if (a > mayor) {
            mayor = a;
        }
    }
    return mayor;
}

function Crear_Json(jugada) {

    return new Promise(resolve => {
        fs.readFile('./Estadisticas/Json/Estadisticas_5min.json', 'utf8', function readFileCallback(err, data) {
            if (err) {
                console.log(err);
            } else {
                obj = JSON.parse(data); //now it an object
                obj.table.push(jugada); //add some data

                json = JSON.stringify(obj); //convert it back to json
                fs.writeFile('./Estadisticas/Json/Estadisticas_5min.json', json, 'utf8', () => { resolve(console.log("hecho")) }); // write it back 
            }
        });
    });

}


// MM20(res.body.c,res.body.c.length-1) Media movil vela anterior a la en desarrollo pero es la que voy a usar para ver el patrón
// MM20(res.body.c,res.body.c.length-10) Media movil de -11 contando la que está en desarrollo 
// MM20(res.body.c,res.body.c.length-20) 


Inicio();






