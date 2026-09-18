(function () {
    const form = document.querySelector('#item-form');
    const list = document.querySelector('#items-list');
    const count = document.querySelector('#item-count');
    const message = document.querySelector('#form-message');
    const formTitle = document.querySelector('#form-title');
    const saveButton = document.querySelector('#save-item');
    const newItemButton = document.querySelector('#new-item');

    const locationsPanel = document.querySelector('#locations-panel');
    const locationsHint = document.querySelector('#locations-hint');
    const locationList = document.querySelector('#location-list');
    const locationCount = document.querySelector('#location-count');
    const locationForm = document.querySelector('#location-form');

    let editingUpc = null;
    let editingItem = null;
    let formBaseline = '';

    const valueOrNull = (value) => value === '' ? null : value;
    const numberOrNull = (value) => value === '' ? null : Number(value);
    const readImageFile = (file) => new Promise((resolve, reject) => {
        if (!file) {
            resolve('');
            return;
        }
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
    });

    const renderItems = async () => {
        const items = await window.inventoryDatabase.getItems();
        count.textContent = `${items.length} item${items.length === 1 ? '' : 's'}`;
        list.replaceChildren();

        if (!items.length) {
            list.innerHTML = '<p class="empty-state">No items saved yet.</p>';
            return;
        }

        items.sort((first, second) => first.description.localeCompare(second.description)).forEach((item) => {
            const row = document.createElement('article');
            row.className = 'item-row';
            const image = item.image?.url ? document.createElement('img') : document.createElement('div');
            image.className = item.image?.url ? '' : 'image-placeholder';
            if (item.image?.url) {
                image.src = item.image.url;
                image.alt = item.image.alt || item.description;
            } else {
                image.textContent = 'No image';
            }
            row.appendChild(image);

            const details = document.createElement('div');
            const rangeLabels = { 'in-range': 'In range', 'soon-ending': 'Soon to be ending', ended: 'Ended', 'soon-in-range': 'Soon to be in range' };
            const locationSummary = (item.aisle || item.aisleSide || item.bay)
                ? `${item.aisle || '—'}-${item.aisleSide || '—'}-${item.bay || '—'}`
                : 'No location set';
            details.innerHTML = `<h3>${item.description}</h3><p>UPC ${item.upc} · Dept ${item.department}</p><p>${locationSummary} · Case ${item.caseSize ?? 0}</p><p>Range: ${rangeLabels[item.rangeStatus] || 'In range'}</p>`;
            row.appendChild(details);

            const actions = document.createElement('div');
            actions.className = 'item-actions';
            const stock = document.createElement('strong');
            stock.textContent = `${item.onHand ?? 0} on hand`;
            actions.appendChild(stock);
            const deleteButton = document.createElement('button');
            deleteButton.className = 'delete-item';
            deleteButton.type = 'button';
            deleteButton.textContent = 'Delete';
            deleteButton.addEventListener('click', async (event) => {
                event.stopPropagation();
                if (!window.confirm(`Delete ${item.description}?`)) {
                    return;
                }
                await window.inventoryDatabase.deleteItem(item.upc);
                if (editingUpc === item.upc) {
                    form.reset();
                    resetEditState();
                }
                message.textContent = 'Item deleted.';
                await renderItems();
            });
            actions.appendChild(deleteButton);
            row.appendChild(actions);
            row.addEventListener('click', () => startEdit(item));
            list.appendChild(row);
        });
    };

    /*
     * LOCATIONS PANEL
     *
     * Renders every location for the item currently being edited. An item
     * can have zero locations (shows an empty state + the add form), one,
     * or many — each with its own optional aisle/aisleSide/bay/shelf/
     * modularId, and one may be flagged primary.
     */
    const renderLocations = async () => {
        if (!editingUpc) {
            locationsPanel.hidden = true;
            locationsHint.hidden = false;
            return;
        }

        locationsPanel.hidden = false;
        locationsHint.hidden = true;

        const locations = await window.inventoryDatabase.getLocations(editingUpc);
        locationCount.textContent = `${locations.length} location${locations.length === 1 ? '' : 's'}`;
        locationList.replaceChildren();

        if (!locations.length) {
            locationList.innerHTML = '<p class="location-empty">No locations set for this item yet.</p>';
            return;
        }

        locations.forEach((location) => {
            const row = document.createElement('div');
            row.className = `location-row${location.isPrimary ? ' is-primary' : ''}`;

            const codeParts = [location.aisle, location.aisleSide, location.bay].filter(Boolean);
            const codeText = codeParts.length ? codeParts.join('-') : 'No aisle/bay set';
            const metaParts = [];
            if (location.shelf) metaParts.push(`Shelf ${location.shelf}`);
            if (location.modularId) metaParts.push(`Modular ${location.modularId}`);

            const details = document.createElement('div');
            details.className = 'location-row-details';
            details.innerHTML = `
                <span class="location-row-code">${codeText}${location.isPrimary ? '<span class="location-primary-badge">PRIMARY</span>' : ''}</span>
                <span class="location-row-meta">${metaParts.length ? metaParts.join(' · ') : 'No shelf/modular set'}</span>
            `;
            row.appendChild(details);

            const rowActions = document.createElement('div');
            rowActions.className = 'location-row-actions';

            const makePrimaryButton = document.createElement('button');
            makePrimaryButton.type = 'button';
            makePrimaryButton.className = 'make-primary';
            makePrimaryButton.textContent = 'Make primary';
            makePrimaryButton.disabled = location.isPrimary;
            makePrimaryButton.addEventListener('click', async () => {
                await window.inventoryDatabase.setPrimaryLocation(editingUpc, location.id);
                message.textContent = 'Primary location updated.';
                await renderLocations();
                await renderItems();
            });
            rowActions.appendChild(makePrimaryButton);

            const removeButton = document.createElement('button');
            removeButton.type = 'button';
            removeButton.className = 'remove-location';
            removeButton.textContent = 'Remove';
            removeButton.addEventListener('click', async () => {
                if (!window.confirm('Remove this location?')) return;
                await window.inventoryDatabase.deleteLocation(location.id);
                message.textContent = 'Location removed.';
                await renderLocations();
                await renderItems();
            });
            rowActions.appendChild(removeButton);

            row.appendChild(rowActions);
            locationList.appendChild(row);
        });
    };

    locationForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (!editingUpc) return;

        const data = new FormData(locationForm);
        try {
            await window.inventoryDatabase.addLocation(editingUpc, {
                aisle: data.get('locAisle').trim(),
                aisleSide: data.get('locAisleSide').trim(),
                bay: data.get('locBay').trim(),
                shelf: data.get('locShelf').trim(),
                modularId: data.get('locModularId').trim(),
                isPrimary: data.get('locIsPrimary') === 'on'
            });

            locationForm.reset();
            message.textContent = 'Location added.';
            await renderLocations();
            await renderItems();
        } catch (error) {
            message.textContent = error.message;
        }
    });

    const setField = (name, value) => { form.elements[name].value = value ?? ''; };
    const formSnapshot = () => Array.from(form.elements)
        .filter((element) => element.name)
        .map((element) => {
            if (element.type === 'file') {
                const file = element.files[0];
                return `${element.name}=${file ? `${file.name}:${file.size}:${file.lastModified}` : ''}`;
            }
            return `${element.name}=${element.value}`;
        })
        .join('&');
    const updateSaveState = () => {
        saveButton.disabled = formSnapshot() === formBaseline;
    };
    const resetEditState = () => {
        editingUpc = null;
        editingItem = null;
        form.classList.remove('editing');
        formTitle.textContent = 'New item';
        saveButton.textContent = 'Save item';
        form.elements.upc.readOnly = false;
        formBaseline = formSnapshot();
        updateSaveState();
        renderLocations();
    };
    const startEdit = async (item) => {
        editingUpc = item.upc;
        editingItem = item;
        form.classList.add('editing');
        formTitle.textContent = 'Edit item';
        saveButton.textContent = 'Update item';
        form.elements.upc.readOnly = true;
        ['upc', 'itemNumber', 'description', 'price', 'onHand', 'caseSize', 'maxShelf', 'department', 'rangeStatus'].forEach((name) => setField(name, item[name]));
        setField('imageUrl', item.image?.url?.startsWith('data:') ? '' : item.image?.url);
        formBaseline = formSnapshot();
        updateSaveState();
        message.textContent = `Editing ${item.description}.`;
        form.scrollIntoView({ behavior: 'smooth', block: 'start' });
        await renderLocations();
    };

    form.addEventListener('reset', () => {
        setTimeout(resetEditState);
    });

    form.addEventListener('input', updateSaveState);
    form.addEventListener('change', updateSaveState);
    newItemButton.addEventListener('click', () => {
        form.reset();
        message.textContent = 'Ready for a new item.';
    });

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const data = new FormData(form);
        const imageFile = data.get('imageFile');
        const uploadedImage = await readImageFile(imageFile instanceof File && imageFile.size ? imageFile : null);
        const item = {
            upc: data.get('upc').trim(),
            itemNumber: valueOrNull(data.get('itemNumber').trim()),
            description: data.get('description').trim(),
            onHand: numberOrNull(data.get('onHand')) ?? 0,
            caseSize: numberOrNull(data.get('caseSize')) ?? 0,
            maxShelf: numberOrNull(data.get('maxShelf')) ?? 0,
            department: data.get('department').trim() || '9999',
            rangeStatus: data.get('rangeStatus') || 'in-range',
            // Location fields are no longer set directly on the item here —
            // they're mirrored automatically from whichever location is
            // primary, via the Locations panel below. On a brand new item
            // with no locations yet, these simply stay blank.
            aisle: editingItem?.aisle ?? null,
            aisleSide: editingItem?.aisleSide ?? null,
            bay: editingItem?.bay ?? null,
            price: numberOrNull(data.get('price')) ?? 1,
            image: { url: uploadedImage || data.get('imageUrl').trim() || editingItem?.image?.url || '', alt: data.get('description').trim() }
        };

        try {
            const wasNewItem = !editingUpc;
            await window.inventoryDatabase.saveItem(item);
            message.textContent = wasNewItem ? 'Item saved. Add its locations below.' : 'Item updated.';

            const savedItem = await window.inventoryDatabase.getItem(item.upc);
            await startEdit(savedItem);
            await renderItems();
        } catch (error) {
            message.textContent = error.message;
        }
    });

    window.inventoryDatabase.seeded.then(async () => {
        await renderItems();
        await renderLocations();
    });
})();