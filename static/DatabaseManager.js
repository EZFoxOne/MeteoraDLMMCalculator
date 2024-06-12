class DatabaseManager {
    constructor(app) {
        this.app = app;
        this.db = null;
    }

    async initialize() {
        try {
            this.db = new Database("METCalculator", 1);
            await this.db.connect();
        } catch (e) {
            console.log(e)
            this.app.NotificationManager.addNotification("Error", e.message, "error");
        }
    }
}

class Database {
    constructor(eBook, version) {
        this.eBook = eBook;
        this.version = version;
        this.db = null;
        this.dbName = "xta_eBooks";
        this.storeName = "eBooks";
        this.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
        if (!this.indexedDB) {
            throw new Error('IndexedDB not supported');
        }
    }

    async connect() {
        return new Promise((resolve, reject) => {
            const request = this.indexedDB.open(this.dbName, this.version);

            // Adding error handling for request
            request.onerror = async (event) => {
                console.log('Error opening IndexedDB:', this.version);
                this.version += 1
                resolve(await this.connect());
            };

            request.onsuccess = (event) => {
                console.log('Connected to IndexedDB:', this.version)
                this.db = event.target.result;
                // Ensure the object store exists
                if (!this.db.objectStoreNames.contains(this.storeName)) {
                    const version = this.db.version + 1;
                    this.db.close();

                    // Reopening with a new version to create or update object store
                    const secondRequest = this.indexedDB.open(this.dbName, version);

                    // Adding error handling for secondRequest
                    secondRequest.onerror = (event) => {
                        reject(new Error('Error opening IndexedDB for object store creation'));
                    };

                    secondRequest.onupgradeneeded = (event) => {
                        this.db = event.target.result;
                        // Creating object store
                        const objectStore = this.db.createObjectStore("eBooks", { keyPath: 'k' });

                        // Adding success handling for object store creation
                        objectStore.transaction.oncomplete = () => {
                            resolve();
                        };

                        // Adding error handling for object store creation
                        objectStore.transaction.onerror = (event) => {
                            reject(new Error('Error creating object store'));
                        };
                    };

                    // Adding success handling for secondRequest
                    secondRequest.onsuccess = () => {
                        this.db = secondRequest.result;
                    };
                } else {
                    resolve();
                }
            };
        });
    }



    async get(key) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction("eBooks", 'readonly');
            const objectStore = transaction.objectStore("eBooks");
            const request = objectStore.get(key);
            request.onsuccess = (event) => {
                resolve(event.target.result ? event.target.result.v : null);
            };
            request.onerror = (event) => {
                reject(event.error);
            };
        });
    }

    async set(key, value) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction("eBooks", 'readwrite');
            const objectStore = transaction.objectStore("eBooks");
            const request = objectStore.put({k: key, v: value});
            request.onsuccess = () => {
                resolve();
            };
            request.onerror = (event) => {
                reject(event.error);
            };
        });
    }

    async delete(key) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction("eBooks", 'readwrite');
            const objectStore = transaction.objectStore("eBooks");
            const request = objectStore.delete(key);
            request.onsuccess = () => {
                resolve();
            };
            request.onerror = (event) => {
                reject(event.error);
            };
        });
    }

    async list() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction("eBooks", 'readonly');
            const objectStore = transaction.objectStore("eBooks");
            const request = objectStore.getAllKeys();
            request.onsuccess = (event) => {
                resolve(event.target.result);
            };
            request.onerror = (event) => {
                reject(event.error);
            };
        });
    }

    async getAll() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction("eBooks", 'readonly');
            const objectStore = transaction.objectStore("eBooks");
            const request = objectStore.getAll();
            request.onsuccess = (event) => {
                resolve(event.target.result);
            };
            request.onerror = (event) => {
                reject(event.error);
            };
        });
    }

    async clear() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction("eBooks", 'readwrite');
            const objectStore = transaction.objectStore("eBooks");
            const request = objectStore.clear();
            request.onsuccess = () => {
                resolve();
            };
            request.onerror = (event) => {
                reject(event.error);
            };
        });
    }
}