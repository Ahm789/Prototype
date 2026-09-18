(function () {
    const databaseName = 'asda-inventory';
    const databaseVersion = 3;
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

        request.onupgradeneeded = (event) => {
            const database = request.result;
            const oldVersion = event.oldVersion;

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

            /*
             * MIGRATION (v2 -> v3): items can now have ZERO, ONE, or MANY
             * locations. "modulars" becomes the source of truth for every
             * bay/area an item can be found in — each record has its own
             * aisle/aisleSide/bay/shelf/modularId (all optional), plus an
             * isPrimary flag. The item's own aisle/aisleSide/bay fields are
             * kept in sync with whichever location is primary, so existing
             * code reading item.aisle etc. keeps working unchanged.
             *
             * Only items that actually HAD location data get back-filled
             * into a location record here — items with no aisle/bay stay
             * location-less rather than getting an empty placeholder.
             */
            if (oldVersion < 3) {
                const modulars = request.transaction.objectStore('modulars');
                const items = request.transaction.objectStore('items');
                const seenUpcs = new Set();

                modulars.openCursor().onsuccess = (cursorEvent) => {
                    const cursor = cursorEvent.target.result;
                    if (!cursor) return;

                    const modular = cursor.value;
                    if (modular.aisle === undefined) {
                        const itemRequest = items.get(modular.upc);
                        itemRequest.onsuccess = () => {
                            const item = itemRequest.result;
                            const isFirstForUpc = !seenUpcs.has(modular.upc);
                            seenUpcs.add(modular.upc);

                            cursor.update({
                                ...modular,
                                aisle: item?.aisle || '',
                                aisleSide: item?.aisleSide || '',
                                bay: modular.position || item?.bay || '',
                                shelf: modular.shelf || '',
                                isPrimary: isFirstForUpc
                            });
                            // Must continue only after update() is issued for
                            // THIS cursor position — calling continue() any
                            // earlier invalidates the cursor before update()
                            // runs and aborts the whole upgrade transaction.
                            cursor.continue();
                        };
                        itemRequest.onerror = () => cursor.continue();
                    } else {
                        cursor.continue();
                    }
                };
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
                modularId: buildModularId({ aisle: 'FF16', aisleSide: 'R', bay: '18', shelf: '2' }),
                name: 'Bakery Frozen Garlic Flatbread',
                aisle: 'FF16',
                aisleSide: 'R',
                bay: '18',
                shelf: '2',
                isPrimary: true
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
                // Only give the item a location record if it actually has
                // location data — items with none of these fields stay
                // location-less, which downstream UI should handle by
                // showing "no location set" rather than an empty entry.
                if (item.aisle || item.aisleSide || item.bay || item.modularId) {
                    stores.modulars.add({
                        upc: item.upc,
                        modularId: buildModularId({ aisle: item.aisle, aisleSide: item.aisleSide, bay: item.bay, shelf: item.shelf || '' }) || item.modularId || '',
                        name: item.description,
                        aisle: item.aisle || '',
                        aisleSide: item.aisleSide || '',
                        bay: item.bay || '',
                        shelf: item.shelf || '',
                        isPrimary: true
                    });
                }
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

    // Builds a modular ID from a location's own fields when one isn't
    // supplied explicitly: FF-{aisle}-{aisleSide}-{bay}-{shelf}. Only the
    // segments that are actually set are included, so a location with just
    // an aisle and bay (no shelf) still gets a sensible ID rather than a
    // string full of blanks. "FF" = Frozen Food, this app's department.
    const buildModularId = (location = {}) => {
        const segments = [location.aisle, location.aisleSide, location.bay, location.shelf]
            .map((value) => (value || '').toString().trim())
            .filter(Boolean);
        return segments.length ? ['FF', ...segments].join('-') : '';
    };

    // Every location record across every item, regardless of UPC — used to
    // check modular ID uniqueness globally, since a physical bay/shelf spot
    // can't belong to two different location records at once.
    const getAllLocations = async () => {
        const database = await window.inventoryDatabase.ready;
        const transaction = database.transaction('modulars', 'readonly');
        return requestToPromise(transaction.objectStore('modulars').getAll());
    };

    // Returns every location record for an item — could be an empty array
    // if the item has no location set yet. Primary location (if any) is
    // sorted first.
    const getModulars = async (upc) => {
        const database = await window.inventoryDatabase.ready;
        const transaction = database.transaction('modulars', 'readonly');
        const results = await requestToPromise(transaction.objectStore('modulars').index('upc').getAll(upc));
        return results.sort((first, second) => (second.isPrimary ? 1 : 0) - (first.isPrimary ? 1 : 0));
    };

    // Alias: "locations" is the clearer name going forward, existing
    // callers of getModulars keep working unchanged.
    const getLocations = getModulars;

    /*
     * Adds a bay/area for an item. Every field is optional — an item can
     * have a location record with no aisle, no aisleSide, no bay, and no
     * modularId if that's genuinely unknown, and items can have as many
     * of these records as needed. Pass { isPrimary: true } to make this
     * the item's main location (mirrors aisle/aisleSide/bay onto the item
     * record itself). The first location ever added for a UPC becomes
     * primary automatically.
     */
    const addLocation = async (upc, location = {}) => {
        const existing = await getModulars(upc);
        const isFirst = existing.length === 0;

        const explicitModularId = (location.modularId || '').trim();
        const modularId = explicitModularId || buildModularId(location);

        if (modularId) {
            const allLocations = await getAllLocations();
            const duplicate = allLocations.find((existingLocation) => existingLocation.modularId === modularId);
            if (duplicate) {
                throw new Error(`Modular ID ${modularId} is already in use for ${duplicate.upc === upc ? 'another location on this item' : `item ${duplicate.upc}`}.`);
            }
        }

        const record = {
            upc,
            modularId,
            name: location.name || '',
            aisle: location.aisle || '',
            aisleSide: location.aisleSide || '',
            bay: location.bay || '',
            shelf: location.shelf || '',
            isPrimary: Boolean(location.isPrimary) || isFirst,
            updatedAt: new Date().toISOString()
        };

        const id = await runTransaction(['modulars'], 'readwrite', (stores) => stores.modulars.add(record));

        if (record.isPrimary) {
            await setPrimaryLocation(upc, id);
        }

        return id;
    };

    const updateLocation = async (id, updates) => {
        const database = await window.inventoryDatabase.ready;
        const existingRecord = await new Promise((resolve, reject) => {
            const transaction = database.transaction('modulars', 'readonly');
            const request = transaction.objectStore('modulars').get(id);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
        if (!existingRecord) return;

        const merged = { ...existingRecord, ...updates };
        const explicitModularId = updates.modularId !== undefined
            ? updates.modularId.trim()
            : (existingRecord.modularId || '').trim();
        const modularId = explicitModularId || buildModularId(merged);

        if (modularId) {
            const allLocations = await getAllLocations();
            const duplicate = allLocations.find((existingLocation) => existingLocation.modularId === modularId && existingLocation.id !== id);
            if (duplicate) {
                throw new Error(`Modular ID ${modularId} is already in use for ${duplicate.upc === existingRecord.upc ? 'another location on this item' : `item ${duplicate.upc}`}.`);
            }
        }

        return runTransaction(['modulars'], 'readwrite', (stores) => {
            stores.modulars.put({
                ...merged,
                modularId,
                id,
                updatedAt: new Date().toISOString()
            });
        });
    };

    // Deletes one location. If the deleted location was primary and other
    // locations remain, the next one becomes primary automatically. If it
    // was the item's only location, the item simply has none left — its
    // own aisle/aisleSide/bay fields are cleared rather than left stale.
    const deleteLocation = async (id) => {
        const database = await window.inventoryDatabase.ready;
        const existingRecord = await new Promise((resolve, reject) => {
            const transaction = database.transaction('modulars', 'readonly');
            const request = transaction.objectStore('modulars').get(id);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });

        await runTransaction(['modulars'], 'readwrite', (stores) => stores.modulars.delete(id));

        if (!existingRecord) return;

        const remaining = await getModulars(existingRecord.upc);

        if (!remaining.length) {
            const item = await getItem(existingRecord.upc);
            if (item) {
                item.aisle = '';
                item.aisleSide = '';
                item.bay = '';
                await saveItem(item);
            }
            return;
        }

        if (existingRecord.isPrimary) {
            await setPrimaryLocation(existingRecord.upc, remaining[0].id);
        }
    };

    /*
     * Marks one location as primary for an item and clears the flag on the
     * rest. Also mirrors that location's aisle/aisleSide/bay onto the item
     * itself, so task cards, search results, and the metrics row (which all
     * read item.aisle/aisleSide/bay directly) stay correct without changes.
     */
    const setPrimaryLocation = async (upc, primaryId) => {
        const locations = await getModulars(upc);

        await runTransaction(['modulars'], 'readwrite', (stores) => {
            locations.forEach((location) => {
                stores.modulars.put({ ...location, isPrimary: location.id === primaryId });
            });
        });

        const primary = locations.find((location) => location.id === primaryId);
        if (primary) {
            const item = await getItem(upc);
            if (item) {
                item.aisle = primary.aisle || '';
                item.aisleSide = primary.aisleSide || '';
                item.bay = primary.bay || '';
                await saveItem(item);
            }
        }
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
        getLocations,
        getAllLocations,
        buildModularId,
        addLocation,
        updateLocation,
        deleteLocation,
        setPrimaryLocation,
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