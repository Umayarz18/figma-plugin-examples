figma.showUI(__html__);

const loadImage = (imageUrl: string, layerName: any, node: InstanceNode) => {
  fetch(imageUrl)
    .then(response => response.arrayBuffer())
    .then(imageBytes => {
      handleImage(new Uint8Array(imageBytes), layerName, node)
    })
}

const handleImage = (imageBytes: Uint8Array, key: string, node: SceneNode) => {
  // if node has children, recursively call handleImage
  if ("children" in node) {
    for (const child of node.children) {
      handleImage(imageBytes, key, child)
    }
  } else {
    // if layer has fills, and name matches the key
    if ("fills" in node && node.name.toLowerCase() === key.toLowerCase()) {
      const imageRectangleNode = node as RectangleNode
      const image = figma.createImage(imageBytes)
      imageRectangleNode.fills = [{
        type: "IMAGE",
        scaleMode: "FILL",
        imageHash: image.hash
      }
      ];
    }
  }
}

figma.ui.onmessage = async msg => {
  if (msg.type === 'update-random') {
    let selectedNode = figma.currentPage.selection[0];
    const getRandomEntry = (max: number, min: number) => Math.floor(Math.random() * max) + min;
    if ('children' in selectedNode) {
      const pokemonCards = selectedNode.findAll(node => node.type == 'INSTANCE' && node.id.includes('1:')) as InstanceNode[];
      // for each card, send its node, random index to next event
      pokemonCards.forEach(pokemonCard => {
        updateCard(pokemonCard, getRandomEntry(898, 1))
      })
    }
  }
  else {
    figma.closePlugin();
  }
};


async function updateCard(pokeCard: InstanceNode, randomEntry: number) {
  if ('children' in pokeCard) {
    fetch(`https://pokeapi.co/api/v2/pokemon/${randomEntry}`, {
      method: 'GET',
    }).then(response => response.text()).then(data => {
      const pokemonData = JSON.parse(data);
      const cardTitle = pokeCard.findOne((node: { type: string; }) => node.type == 'TEXT') as TextNode;
      if (cardTitle != null) {
        const fontName = cardTitle.fontName as FontName
        figma.loadFontAsync(fontName).then(() => {
          cardTitle.characters = pokemonData.name;
        })
      }

      const pokemonImage = pokeCard.findOne(node => node.type == 'RECTANGLE' && node.name.toLocaleLowerCase() == 'pokemon image') as RectangleNode;
      if (pokemonImage != null) {
        const image = pokemonData.sprites.other["official-artwork"]["front_default"];
        loadImage(image, 'Pokemon image', pokeCard)
      }
    })
  }
}
