(function () {
    const form = document.querySelector('#item-form');
    const list = document.querySelector('#items-list');
    const count = document.querySelector('#item-count');
    const message = document.querySelector('#form-message');
    const formTitle = document.querySelector('#form-title');
    const saveButton = document.querySelector('#save-item');
    const newItemButton = document.querySelector('#new-item');
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
            details.innerHTML = `<h3>${item.description}</h3><p>UPC ${item.upc} · Dept ${item.department}</p><p>${item.aisle || '—'}-${item.aisleSide || '—'}-${item.bay || '—'} · Case ${item.caseSize ?? 0}</p><p>Range: ${rangeLabels[item.rangeStatus] || 'In range'}</p>`;
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
    };
    const startEdit = async (item) => {
        editingUpc = item.upc;
        editingItem = item;
        form.classList.add('editing');
        formTitle.textContent = 'Edit item';
        saveButton.textContent = 'Update item';
        form.elements.upc.readOnly = true;
        ['upc', 'itemNumber', 'description', 'price', 'onHand', 'caseSize', 'maxShelf', 'department', 'rangeStatus', 'aisle', 'aisleSide', 'bay', 'shelf'].forEach((name) => setField(name, item[name]));
        setField('imageUrl', item.image?.url?.startsWith('data:') ? '' : item.image?.url);
        const modulars = await window.inventoryDatabase.getModulars(item.upc);
        setField('modularId', modulars[0]?.modularId);
        formBaseline = formSnapshot();
        updateSaveState();
        message.textContent = `Editing ${item.description}.`;
        form.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
            aisle: valueOrNull(data.get('aisle').trim()),
            aisleSide: valueOrNull(data.get('aisleSide').trim()),
            bay: valueOrNull(data.get('bay').trim()),
            shelf: valueOrNull(data.get('shelf').trim()),
            price: numberOrNull(data.get('price')) ?? 1,
            image: { url: uploadedImage || data.get('imageUrl').trim() || editingItem?.image?.url || '', alt: data.get('description').trim() }
        };

        try {
            await window.inventoryDatabase.saveItem(item);
            const modularId = data.get('modularId').trim();
            if (modularId) {
                await window.inventoryDatabase.addModular({ upc: item.upc, modularId, name: item.description, shelf: item.shelf || '', position: '' });
            }
            form.reset();
            message.textContent = editingUpc ? 'Item updated.' : 'Item saved.';
            resetEditState();
            await renderItems();
        } catch (error) {
            message.textContent = error.message;
        }
    });

    window.inventoryDatabase.seeded.then(renderItems);
})();