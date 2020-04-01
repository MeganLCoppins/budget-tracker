let db;
// create a database request .. ("name of db", version#)
const request = indexedDB.open("budget", 1);

// creating obj store w/ autoIncrement set to true to automatically increment id with each upgrade 
request.onupgradeneeded = function(event) {
    const db = event.target.result;
    db.createObjectStore("pending", { autoIncrement: true})
}

// check if the user is online otherwise console log err
request.onsuccess = function(event) {
    db = event.target.result;
    if (navigator.onLine) {
        checkDatabase();
    }
};

request.onerror = function(event) {
    console.log("Error: " + event.target.errorCode);
};

// function to save record to db
function saveRecord(record) {
    // create a transaction on the pending db with readwrite access
    const transaction = db.transaction(["pending"], "readwrite");
    // access pending obj store
    const accessStore = transaction.objectStore("pending");
    // add record to store with add method
    accessStore.add(record);
}

// function to check db for saved records
function checkDatabase() {
    // open a transaction on your pending db
    const transaction = db.transaction(["pending"]);
    // access your pending object store
    const accessStore = transaction.objectStore("pending");
    // get all records from store and set to a variable
    const getAll = accessStore.getAll();

    getAll.onsuccess = function() {
        if (getAll.result.length > 0) {
          fetch("/api/transaction/bulk", {
            method: "POST",
            body: JSON.stringify(getAll.result),
            headers: {
              Accept: "application/json, text/plain, */*",
              "Content-Type": "application/json"
            }
          })
          .then(response => response.json())
          .then(() => {
              // if successful, open a transaction on your pending db
              const transaction = db.transaction(["pending"]);
              // access your pending object store
              const accessStore = transaction.objectStore("pending");
              // clear all items in your store
              accessStore.clear();
          });
        }
      };
    }
// listen for app coming back online
window.addEventListener("online", checkDatabase);