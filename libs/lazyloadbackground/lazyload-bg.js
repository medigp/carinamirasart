/*
* DATA-LAZYLOAD-BACKGROUND-URL API
* 
* selector : data-element definit al DOM amb la url de la imatge completa
* previewSelector : data-element definit al DOM amb la url de la imatge de previsualització
* defaultSrcPreview : url de la imatge de previsualització per defecte
* addBackgroundAnimation : en cas que no s'hagi definit un previewSelector ni un defaultSrcPreview, afegir una classe "add-animation"
* forceNewDownload : forçar que la imatge definida al "selector" es descarregui a cada inicialització
*
*/

let defaultOptions = {
  selector: 'data-lazyload-background-url',
  previewSelector : 'data-lazyload-background-url-preview',
  defaultSrcPreview: null,
  addBackgroundAnimation : false,
  forceNewDownload : false
}

function BackgroundNode({selector, previewSelector, node, defaultSrcPreview, addBackgroundAnimation = false, forceNewDownload = false}) {
  
  let src = node.getAttribute(selector);
  if(!src)
    return;
  
  let loadingClassName = 'loading';
  let downloadedClassName = 'downloaded';
  
  if(forceNewDownload)
    src += '?v='+ (new Date()).getTime();
  
  let init = () => {
    node.classList.add(loadingClassName);
    loadLazyLoadTemporaryBlock();
  };

  /* Es crea un bloc temporal. Si s'ha definit un preview o un defaultSrcPreview, s'afegeix aquesta imatge com a fons*/
  let loadLazyLoadTemporaryBlock = () => {
    let bgElement = document.createElement('div');
    bgElement.classList.add('background-lazy-loader');
    if(addBackgroundAnimation)
      bgElement.classList.add('add-animation');

    let srcPreview = node.getAttribute(previewSelector) || defaultSrcPreview;
    if(srcPreview){
      bgElement.classList.remove('add-animation');
      bgElement.style.backgroundImage = `url(${srcPreview})`;
    }

    node.appendChild(bgElement);
  };
  

  /* Gestió de l'estat de la càrrega de la imatge*/
  let loadImage = (onComplete) => {
    return new Promise((resolve, reject) => {
      let img = new Image();
      img.src = src;
      img.onload = function(){
        show(onComplete);
      }
    });
  };

  /* Aplicar la imatge com a background (després d'haver estat descarregada) */
  let show = (onComplete) => {
    requestAnimationFrame(() => {
      node.classList.add(downloadedClassName);
      //Afegim una animació al acabar la descàrrega de la imatge
      setTimeout(function(){
        node.classList.remove(loadingClassName);
        node.classList.remove(downloadedClassName);
        node.style.backgroundImage = `url(${src})`
        //node.removeChild(bgElement);
      }, 100);
      onComplete();  
    })
  }

  /* Executa les funcions bàsiques */
  init();

  return {
    node,
    loadImage
  }
}

/*
* Funció del Lazy Loader
*/
function BackgroundLazyLoader({selector, previewSelector, defaultSrcPreview, addBackgroundAnimation, forceNewDownload} = defaultOptions) {
  let nodes = [].slice.apply(document.querySelectorAll(`[${selector}]`))
    .map(node => new BackgroundNode({node, selector, previewSelector, defaultSrcPreview, addBackgroundAnimation, forceNewDownload}));

  let callback = (entries, observer) => {
    entries.forEach(({target, isIntersecting}) => {
      if (!isIntersecting) {
        return;
      }

      let obj = nodes.find(it => it.node.isSameNode(target));
      
      if (obj) {
        obj.loadImage(() => {
        // Unobserve the node:
        observer.unobserve(target);
        // Remove this node from our list:
        nodes = nodes.filter(n => !n.node.isSameNode(target));

        // If there are no remaining unloaded nodes,
        // disconnect the observer since we don't need it anymore.
        if (!nodes.length) {
          observer.disconnect();
        }
        });
      }
    })
  };
    
  let observer = new IntersectionObserver(callback);
  nodes.forEach(node => observer.observe(node.node));
};