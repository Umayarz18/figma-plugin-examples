figma.showUI(__html__);

figma.ui.onmessage = async (msg) => {
	let selectedNode = figma.currentPage.selection[0];

	if (msg.type === 'update-random') {
		if ('children' in selectedNode && selectedNode.type == 'FRAME') {
			const pokemonCards = selectedNode.findAll(
				(node) =>
					node.type == 'INSTANCE' &&
					node.mainComponent?.name.toLowerCase() == 'pokecard'
			) as InstanceNode[];
			// for each card, send its node, random index to next event
			pokemonCards.forEach((pokemonCard) => {
				updateCard(pokemonCard, getRandomEntry(898, 1));
			});
		} else if (
			selectedNode.type == 'INSTANCE' &&
			selectedNode.mainComponent?.name.toLowerCase() == 'pokecard'
		) {
			updateCard(selectedNode, getRandomEntry(898, 1));
		}
	} else if (msg.type == 'cancel') {
		figma.closePlugin();
	} else if (msg.type == 'update-by-name') {
	}
};

const getRandomEntry = (max: number, min: number) =>
	Math.floor(Math.random() * max) + min;

const loadImage = (imageUrl: string, layerName: any, node: InstanceNode) => {
	fetch(imageUrl)
		.then((response) => response.arrayBuffer())
		.then((imageBytes) => {
			handleImage(new Uint8Array(imageBytes), layerName, node);
		});
};

const handleImage = (imageBytes: Uint8Array, key: string, node: SceneNode) => {
	// if node has children, recursively call handleImage
	if ('children' in node) {
		for (const child of node.children) {
			handleImage(imageBytes, key, child);
		}
	} else {
		// if layer has fills, and name matches the key
		if ('fills' in node && node.name.toLowerCase() === key.toLowerCase()) {
			const imageRectangleNode = node as RectangleNode;
			const image = figma.createImage(imageBytes);
			imageRectangleNode.fills = [
				{
					type: 'IMAGE',
					scaleMode: 'FILL',
					imageHash: image.hash,
				},
			];
		}
	}
};

const handleText = (cardTitle: TextNode, pokemonName: string) => {
	if (cardTitle != null) {
		const fontName = cardTitle.fontName as FontName;
		figma.loadFontAsync(fontName).then(() => {
			cardTitle.characters = pokemonName;
		});
	}
};

async function updateCard(pokeCard: InstanceNode, randomEntry: number) {
	if ('children' in pokeCard) {
		fetch(`https://pokeapi.co/api/v2/pokemon/${randomEntry}`, {
			method: 'GET',
		})
			.then((response) => response.text())
			.then((data) => {
				const pokemonData = JSON.parse(data);
				const cardTitle = pokeCard.findOne(
					(node: { type: string }) => node.type == 'TEXT'
				) as TextNode;
				handleText(cardTitle, pokemonData.name);

				const pokemonImage = pokeCard.findOne(
					(node) =>
						node.type == 'RECTANGLE' &&
						node.name.toLocaleLowerCase() == 'pokemon image'
				) as RectangleNode;

				if (pokemonImage != null) {
					const image =
						pokemonData.sprites.other['official-artwork'][
							'front_default'
						];
					loadImage(image, 'Pokemon image', pokeCard);
				}
			});
	}
}
