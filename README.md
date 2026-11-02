# Sopa de Letras Interactiva para TikTok Live 🔠

Una aplicación web interactiva creada con HTML y JavaScript que permite a los espectadores de **TikTok EN VIVO** jugar una sopa de letras mediante los comentarios del chat en tiempo real. 

## Requisitos
* [Tikfinity](https://tikfinity.zerody.one/): Descargar la versión de escritorio, **no usar la versión web**. Abre Tikfinity y conecta tu cuenta.


* OBS Studio, TikTok Live Studio o cualquier software de transmisión que soporte fuentes de navegador (Browser Source).
* _(opcional)_ Navegador web: Google Chrome, Mozilla Firefox ó Microsoft Edge. (Fue diseñado en Firefox)

## Instrucciones de Instalación y Uso
1. Descarga los archivos `index.html` y `script.js` (Botón verde "Code", luego "Download ZIP") y extráelos en una misma carpeta en tu computadora.
2. 
   * Opción 1 (overlay):
     * En OBS Studio (o en tu software de transmisión), agrega una nueva **Fuente de Navegador** (Browser Source).
     * Marca la casilla "Archivo local" y haz clic en Examinar para seleccionar el archivo `index.html` que descargaste.
     * Ajusta el ancho y alto en las propiedades de la fuente para que encaje en tu pantalla.
    * Opción 2 (fondo opaco):
      * Abre el archivo ```index.html``` con tu navegador de preferencia (Google Chrome, Mozilla Firefox, Microsoft Edge, etc...).
      * Captura la pantalla o la ventana con tu software de transmión (OBS Studio, TikTok Live Studio, etc)
3. Inicia tu directo de TikTok, asegúrate de que Tikfinity esté corriendo en segundo plano, ¡y listo!

## ¿Cómo funciona?
El script se conecta de forma local a Tikfinity para leer los eventos del chat. Captura la lista personalizada de palabras a encontrar, separadas por coma, espacio y/o renglón. Al iniciar la partida, cuando un espectador escribe la coordenada (número y letra) de la inicial de una palabra que encontró en la sopa de letras, el overlay se actualiza automáticamente marcando la palabra descubierta, y llevará el puntaje de cada espectador.

Nota: TikTok a veces censura algunas coordenadas en formatos específicos. Aunque la aplicación admite distintos formatos, recomiendo usar el formato número-espacio-letra (ejemplo: "a 2") para que TikTok no lo censure. Recomienda a tus espectadores que escriban sus coordenadas en este formato.

## Descargo de Responsabilidad
Este proyecto es una herramienta independiente de código abierto creada para la comunidad. No tiene ninguna afiliación oficial, patrocinio ni respaldo por parte de TikTok, ByteDance o Tikfinity. Su uso es responsabilidad de cada usuario.