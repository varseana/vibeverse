// Factor de zoom de escritorio (--ui-zoom en styles.css). Las coordenadas del
// puntero vienen en px de pantalla; dentro del contenido escalado hay que
// dividir entre este factor para que lo arrastrado siga al mouse.
export const uiZoom = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--ui-zoom')) || 1
