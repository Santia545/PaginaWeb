# Página Web - Middleground

Esta página web permite a un grupo de amigos encontrar el mejor punto de reunión, minimizando el tiempo total de viaje para todos, utilizando la API de Flask y OpenRouteService.

## Características

- Añade ubicaciones de amigos y lugares candidatos en el mapa.
- Calcula el lugar óptimo de reunión.
- Visualiza el grafo de distancias entre amigos y lugares.
- Interfaz intuitiva y responsiva.

## Uso

1. Abre `index.html` en tu navegador.
2. Haz clic en el mapa para añadir marcadores de amigos o lugares.
3. Usa los botones para cambiar entre modo "Amigo" y "Lugar".
4. Haz clic en "Encontrar Mejor Lugar" para calcular el punto óptimo.
5. Haz clic en "Mostrar Grafo" para visualizar las conexiones y tiempos de viaje.
6. Elimina marcadores del mapa haciendo click sobre ellos
6. Modifica la ubicación de los marcadores arrastrando hasta el destino deseado
## Despliegue

Puedes desplegar la página en cualquier servicio de hosting estático (por ejemplo, Firebase Hosting).

### Desplegar en Firebase Hosting

1. Instala Firebase CLI y ejecuta `firebase login`.
2. Inicializa el proyecto con `firebase init`.
3. Ejecuta `firebase deploy` para publicar la página.

## Notas

- Necesitas una clave de API de Google Maps para que el mapa funcione correctamente.
- La página se comunica con la API de  Flask para los cálculos, asegúrate de que la API esté accesible.
[text](https://github.com/Santia545/FlaskApi)

## Autor

César Covarrubias Rosales  
CETI - Estructuras de Datos y Algoritmia
