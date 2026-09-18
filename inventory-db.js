(function () {
    const databaseName = 'asda-inventory';
    const databaseVersion = 2;
    const sampleUpc = '05060198649592';

    const generatedFrozenItems = [
        {
            upc: '9900000000011', itemNumber: '990000001', description: 'ASDA Crispy Skin-On Fries 750g', price: 2.20,
            department: '72', aisle: '15', aisleSide: 'L', bay: '3', imageUrl: 'https://asdagroceries.scene7.com/is/image/asdagroceries/5057172606085?$ProdListProd$', modularId: 'FZ-15-L-003'
        },
        {
            upc: '9900000000028', itemNumber: '990000002', description: 'ASDA Seasoned Sweet Potato Fries 500g', price: 2.20,
            department: '72', aisle: '15', aisleSide: 'L', bay: '4', imageUrl: 'https://asdagroceries.scene7.com/is/image/asdagroceries/5054781734895?$ProdListProd$', modularId: 'FZ-15-L-004'
        },
        {
            upc: '9900000000035', itemNumber: '990000003', description: 'ASDA Frozen Garden Peas 1kg', price: 1.50,
            department: '72', aisle: '15', aisleSide: 'R', bay: '5', modularId: 'VEG-15-R-005'
        },
        {
            upc: '9900000000042', itemNumber: '990000004', description: 'ASDA Double Pepperoni Stonebaked Pizza 309g', price: 1.72,
            department: '91', aisle: '16', aisleSide: 'L', bay: '8', imageUrl: 'https://asdagroceries.scene7.com/is/image/asdagroceries/T_5063089839119?$ProdListProd$', modularId: 'PIZ-16-L-008'
        },
        {
            upc: '9900000000059', itemNumber: '990000005', description: 'ASDA Four Cheese Stonebaked Pizza 315g', price: 1.72,
            department: '91', aisle: '16', aisleSide: 'L', bay: '9', imageUrl: 'https://asdagroceries.scene7.com/is/image/asdagroceries/T_5063089839096?$ProdListProd$', modularId: 'PIZ-16-L-009'
        },
        {
            upc: '9900000000066', itemNumber: '990000006', description: 'ASDA Chicken Breast Strips 500g', price: 4.58,
            department: '71', aisle: '15', aisleSide: 'L', bay: '12', imageUrl: 'https://asdagroceries.scene7.com/is/image/asdagroceries/5063089891636?$ProdListProd$', modularId: 'CHK-15-L-012'
        },
        {
            upc: '9900000000073', itemNumber: '990000007', description: 'Free From by ASDA 20 Chicken Nuggets 400g', price: 4.00,
            department: '91', aisle: '15', aisleSide: 'L', bay: '14', imageUrl: 'https://asdagroceries.scene7.com/is/image/asdagroceries/5063089794227?$ProdListProd$', modularId: 'FF-15-L-014'
        },
        {
            upc: '9900000000080', itemNumber: '990000008', description: 'ASDA 4 Battered Cod Fillets 440g', price: 7.50,
            department: '71', aisle: '14', aisleSide: 'R', bay: '6', imageUrl: 'https://asdagroceries.scene7.com/is/image/asdagroceries/5063089700778?$ProdListProd$', modularId: 'FISH-14-R-006'
        },
        {
            upc: '9900000000097', itemNumber: '990000009', description: 'Tiger Tiger Dumpling Pastry 300g', price: 2.50,
            department: '71', aisle: '14', aisleSide: 'L', bay: '15', imageUrl: 'https://asdagroceries.scene7.com/is/image/asdagroceries/5024448572061?$ProdListProd$', modularId: 'WF-14-L-015'
        },
        {
            upc: '9900000000103', itemNumber: '990000010', description: 'Cornetto MAX Hazelnut & Chocolate Ice Cream Cones 4x90ml', price: 4.00,
            department: '73', aisle: '16', aisleSide: 'R', bay: '20', imageUrl: 'https://asdagroceries.scene7.com/is/image/asdagroceries/8711327680685?$ProdListProd$', modularId: 'ICE-16-R-020'
        },
        {
            upc: '9900000000110', itemNumber: '990000011', description: 'Twister Mini Pineapple Ice Cream Lollies 6x50ml', price: 2.74,
            department: '73', aisle: '16', aisleSide: 'R', bay: '21', imageUrl: 'https://asdagroceries.scene7.com/is/image/asdagroceries/8721274803761?$ProdListProd$', modularId: 'ICE-16-R-021'
        },
        {
            upc: '9900000000127', itemNumber: '990000012', description: 'ASDA Party Food 2 Mature Cheddar & Spring Onion Bakes 230g', price: 2.17,
            department: '91', aisle: '14', aisleSide: 'L', bay: '18', imageUrl: 'https://asdagroceries.scene7.com/is/image/asdagroceries/5057172100675?$ProdListProd$', modularId: 'PARTY-14-L-018'
        }
    ];

    const requestToPromise = (request) => new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });

    const openDatabase = () => new Promise((resolve, reject) => {
        const request = indexedDB.open(databaseName, databaseVersion);

        request.onupgradeneeded = () => {
            const database = request.result;
            if (database.objectStoreNames.contains('items')) {
                const existingItems = request.transaction.objectStore('items');
                if (existingItems.indexNames.contains('itemNumber')) {
                    existingItems.deleteIndex('itemNumber');
                }
                existingItems.createIndex('itemNumber', 'itemNumber', { unique: true });
            } else {
                const items = database.createObjectStore('items', { keyPath: 'upc' });
                items.createIndex('itemNumber', 'itemNumber', { unique: true });
                items.createIndex('department', 'department', { unique: false });
            }

            if (!database.objectStoreNames.contains('onHandHistory')) {
                const history = database.createObjectStore('onHandHistory', { keyPath: 'id', autoIncrement: true });
                history.createIndex('upc', 'upc', { unique: false });
                history.createIndex('date', 'date', { unique: false });
            }

            if (!database.objectStoreNames.contains('modulars')) {
                const modulars = database.createObjectStore('modulars', { keyPath: 'id', autoIncrement: true });
                modulars.createIndex('upc', 'upc', { unique: false });
            }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });

    const runTransaction = async (storeNames, mode, operation) => {
        const database = await window.inventoryDatabase.ready;
        return new Promise((resolve, reject) => {
            const transaction = database.transaction(storeNames, mode);
            const stores = storeNames.reduce((result, name) => {
                result[name] = transaction.objectStore(name);
                return result;
            }, {});
            let result;

            try {
                result = operation(stores);
            } catch (error) {
                reject(error);
                return;
            }

            transaction.oncomplete = () => resolve(result);
            transaction.onerror = () => reject(transaction.error);
            transaction.onabort = () => reject(transaction.error);
        });
    };

    const lastSevenDays = () => {
        const history = [];
        const closingCounts = [12, 11, 10, 13, 12, 12, 12];
        const unitsSold = [3, 2, 4, 1, 3, 2, 0];

        for (let daysAgo = 6; daysAgo >= 0; daysAgo -= 1) {
            const date = new Date();
            date.setHours(0, 0, 0, 0);
            date.setDate(date.getDate() - daysAgo);
            history.push({
                upc: sampleUpc,
                date: date.toISOString().slice(0, 10),
                unitsSold: unitsSold[6 - daysAgo],
                closingOnHand: closingCounts[6 - daysAgo]
            });
        }

        return history;
    };

    const seedDatabase = async () => {
        const existingItem = await getItem(sampleUpc);
        if (existingItem) {
            if (!existingItem.itemNumber) {
                existingItem.itemNumber = '100543572';
            }
            if (!existingItem.image) {
                existingItem.image = {
                    url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=320&q=80',
                    alt: 'Garlic flatbread'
                };
                await saveItem(existingItem);
            }
            const existingItems = await getItems();
            const omelette = existingItems.find((item) => item.upc === '05000326012249' && !item.itemNumber);
            if (omelette) {
                omelette.itemNumber = '100543573';
                await saveItem(omelette);
            }
            return existingItem;
        }

        const item = {
            upc: sampleUpc,
            itemNumber: '100543572',
            description: 'Crostam Garlic Flatbread',
            price: 2.50,
            onHand: 12,
            maxShelf: 14,
            department: 'Bakery & Frozen',
            aisle: 'FF16',
            aisleSide: 'R',
            bay: '18',
            image: {
                url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=320&q=80',
                alt: 'Garlic flatbread'
            },
            updatedAt: new Date().toISOString()
        };

        await saveItem(item);
        await runTransaction(['onHandHistory', 'modulars'], 'readwrite', (stores) => {
            lastSevenDays().forEach((entry) => stores.onHandHistory.add(entry));
            stores.modulars.add({
                upc: sampleUpc,
                modularId: 'BAK-FF16-018',
                name: 'Bakery Frozen Garlic Flatbread',
                shelf: '18',
                position: '2'
            });
        });

        return item;
    };

    const seedGeneratedItems = async () => {
        const existingItems = await getItems();
        const existingUpcs = new Set(existingItems.map((item) => item.upc));
        const newItems = generatedFrozenItems.filter((item) => !existingUpcs.has(item.upc)).map((item) => ({
            ...item,
            onHand: 0,
            caseSize: 0,
            maxShelf: 0,
            rangeStatus: 'in-range',
            image: { url: item.imageUrl || '', alt: item.description },
            updatedAt: new Date().toISOString()
        }));

        for (const item of newItems) {
            await saveItem(item);
        }

        if (!newItems.length) {
            return;
        }

        await runTransaction(['onHandHistory', 'modulars'], 'readwrite', (stores) => {
            newItems.forEach((item) => {
                for (let daysAgo = 6; daysAgo >= 0; daysAgo -= 1) {
                    const date = new Date();
                    date.setHours(0, 0, 0, 0);
                    date.setDate(date.getDate() - daysAgo);
                    stores.onHandHistory.add({
                        upc: item.upc,
                        date: date.toISOString().slice(0, 10),
                        unitsSold: 0,
                        closingOnHand: 0
                    });
                }
                stores.modulars.add({
                    upc: item.upc,
                    modularId: item.modularId,
                    name: item.description,
                    shelf: item.shelf || '',
                    position: item.bay || ''
                });
            });
        });
    };

    const getItem = async (upc) => {
        const database = await window.inventoryDatabase.ready;
        const transaction = database.transaction('items', 'readonly');
        return requestToPromise(transaction.objectStore('items').get(upc));
    };

    const getItems = async () => {
        const database = await window.inventoryDatabase.ready;
        const transaction = database.transaction('items', 'readonly');
        return requestToPromise(transaction.objectStore('items').getAll());
    };

    const saveItem = async (item) => {
        if (!item.itemNumber) {
            throw new Error('ASDA item number is required.');
        }
        const existingItems = await getItems();
        const duplicate = existingItems.find((existingItem) => existingItem.itemNumber === item.itemNumber && existingItem.upc !== item.upc);
        if (duplicate) {
            throw new Error(`ASDA item number ${item.itemNumber} is already used by ${duplicate.description}.`);
        }
        return runTransaction(['items'], 'readwrite', (stores) => stores.items.put({
            ...item,
            updatedAt: item.updatedAt || new Date().toISOString()
        }));
    };

    const deleteItem = async (upc) => {
        const database = await window.inventoryDatabase.ready;
        return new Promise((resolve, reject) => {
            const transaction = database.transaction(['items', 'onHandHistory', 'modulars'], 'readwrite');
            transaction.objectStore('items').delete(upc);
            ['onHandHistory', 'modulars'].forEach((storeName) => {
                const store = transaction.objectStore(storeName);
                const cursorRequest = store.index('upc').openCursor(IDBKeyRange.only(upc));
                cursorRequest.onsuccess = () => {
                    const cursor = cursorRequest.result;
                    if (cursor) {
                        cursor.delete();
                        cursor.continue();
                    }
                };
            });
            transaction.oncomplete = resolve;
            transaction.onerror = () => reject(transaction.error);
        });
    };

    const setItemImage = async (upc, image) => {
        const item = await getItem(upc);
        if (!item) {
            throw new Error(`No item found for UPC ${upc}`);
        }

        item.image = {
            url: image.url || '',
            alt: image.alt || item.description,
            blob: image.blob || null
        };
        await saveItem(item);
        return item;
    };

    const addModular = (modular) => runTransaction(['modulars'], 'readwrite', (stores) => stores.modulars.add(modular));

    const getHistory = async (upc, days = 7) => {
        const database = await window.inventoryDatabase.ready;
        const transaction = database.transaction('onHandHistory', 'readonly');
        const request = transaction.objectStore('onHandHistory').index('upc').getAll(upc);
        const entries = await requestToPromise(request);
        return entries.sort((first, second) => first.date.localeCompare(second.date)).slice(-days);
    };

    const getModulars = async (upc) => {
        const database = await window.inventoryDatabase.ready;
        const transaction = database.transaction('modulars', 'readonly');
        return requestToPromise(transaction.objectStore('modulars').index('upc').getAll(upc));
    };

    const recordSale = async (upc, unitsSold, date = new Date()) => {
        const item = await getItem(upc);
        if (!item) {
            throw new Error(`No item found for UPC ${upc}`);
        }

        const nextOnHand = Math.max(0, item.onHand - unitsSold);
        item.onHand = nextOnHand;
        item.updatedAt = new Date().toISOString();
        await saveItem(item);
        await runTransaction(['onHandHistory'], 'readwrite', (stores) => stores.onHandHistory.add({
            upc,
            date: date.toISOString().slice(0, 10),
            unitsSold,
            closingOnHand: nextOnHand
        }));
        return item;
    };

    window.inventoryDatabase = {
        ready: openDatabase(),
        getItem,
        getItems,
        saveItem,
        deleteItem,
        getHistory,
        getModulars,
        recordSale,
        setItemImage,
        addModular,
        seedDatabase
    };

    window.inventoryDatabase.seeded = window.inventoryDatabase.ready.then(async () => {
        await seedDatabase();
        await seedGeneratedItems();
    });
    window.inventoryDatabase.seeded.catch((error) => {
        console.error('Unable to initialise inventory database', error);
    });
})();