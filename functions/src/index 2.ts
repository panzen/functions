import * as functions from 'firebase-functions';
import * as admin from "firebase-admin";
import {
    validateRestaurant,
    validateOwner,
    validateBranch,
    validateEmployee,
    validateAuth,
    generateAuthToken,
    validateReservation,
    validateItem, validateTable, validateCombos, validateOnlineOrder, validateOrder
} from "./schemas";
import * as bcrypt from "bcrypt";
import {
    addManager,
    addOwner,
    addRestaurant,
    addBranch,
    addEmployee,
    addReservation,
    addItem,
    addTable, addCombo, addOnlineOrder, addOrder
} from "./objects";

admin.initializeApp();

// export const passwordReset = functions.https.onRequest(async (request, response) => {
//     const {error} = validateReset(request.body);
//     if (error) {
//         return response.status(400).send(error.details[0].message)
//     }
//     const manager = await admin.firestore().collection('managerx').where("email", "==", request.body.email).get();
//     if (manager.docs.length === 0) return response.status(400).send('Invalid Email Address');
//
//     // const managerDoc = manager.docs[0];
//
//     //TODO:send mail to the owner with reset link
//
//     return response.status(200).send('Reset link sent to your owner');
// });

export const createOwner = functions.https.onRequest(async (request, response) => {
    response.set('Access-Control-Allow-Origin', '*');

    if (request.method === 'OPTIONS') {
        // Send response to OPTIONS requests
        response.set('Access-Control-Allow-Methods', 'GET, POST');
        response.set('Access-Control-Allow-Headers', 'Content-Type');
        response.set('Access-Control-Max-Age', '3600');
        response.status(204).send('Cors Error ');
    }
    const {error} = validateOwner(request.body);
    if (error) {
        return response.status(400).send(error.details[0].message)
    }
    const owners = await admin.firestore().collection('ownerx').where("email", "==", request.body.email).get();
    if (owners.docs.length > 0) return response.status(401).send('Email Already Registered');

    const salt = await bcrypt.genSalt(10);
    const passwordEncrypted = await bcrypt.hash(request.body.password, salt);

    await admin.firestore().collection('ownerx').add(addOwner(request.body, passwordEncrypted));
    return response.status(200).send("Owner Created Successfully!");
});

export const createRestaurant = functions.https.onRequest(async (request, response) => {
    response.set('Access-Control-Allow-Origin', '*');

    if (request.method === 'OPTIONS') {
        // Send response to OPTIONS requests
        response.set('Access-Control-Allow-Methods', 'GET,POST');
        response.set('Access-Control-Allow-Headers', 'Content-Type');
        response.set('Access-Control-Max-Age', '3600');
        response.status(204).send('Cors Error ');
    }
    const {error} = validateRestaurant(request.body);
    if (error) {
        return response.status(400).send(error.details[0].message)
    }
    const restaurants = await admin.firestore().collection('restaurants').where("email", "==", request.body.email).get();
    if (restaurants.docs.length > 0) return response.status(401).send('Restaurant exists with same emailID');

    //DONE: Add restaurant
    const restaurant = await admin.firestore().collection('restaurants').add(addRestaurant(request.body));

    //add restaurantID to owner doc
    await admin.firestore().collection('ownerx').doc(request.body.ownerID).set({
        restaurantID: restaurant.id
    }, {merge: true});
    return response.status(200).send("Restaurant Created Successfully with owner having the restaurantId!");
});

export const createBranch = functions.https.onRequest(async (request, response) => {
    response.set('Access-Control-Allow-Origin', '*');

    if (request.method === 'OPTIONS') {
        // Send response to OPTIONS requests
        response.set('Access-Control-Allow-Methods', 'GET,POST');
        response.set('Access-Control-Allow-Headers', 'Content-Type');
        response.set('Access-Control-Max-Age', '3600');
        response.status(204).send('Cors Error ');
    }
    const {error} = validateBranch(request.body);
    if (error) {
        return response.status(400).send(error.details[0].message)
    }
    const branches = await admin.firestore().collection('branches').where("email", "==", request.body.email).get();
    if (branches.docs.length > 0) return response.status(400).send('Branch exists with same email');

    // Create Branch Manager
    const managerBody = request.body.manager;
    const managers = await admin.firestore().collection('managerx').where("email", "==", managerBody.email).get();
    if (managers.docs.length > 0) return response.status(400).send('Manager exists with same email');

    const salt = await bcrypt.genSalt(10);
    const passwordEncrypted = await bcrypt.hash(managerBody.password, salt);

    const manager = await admin.firestore().collection('managerx').add(addManager(managerBody, passwordEncrypted));
    if (manager.id === undefined) return response.status(400).send('Server Error Retry');

    // Add Branch
    const branch = await admin.firestore().collection('branches').add(addBranch(request.body, manager.id, [{
        id: manager.id,
        designation: 'MANAGER'
    }]));

    // Add branchID to restaurant
    const restaurant: any | undefined = await admin.firestore().collection('restaurants').doc(request.body.restaurantID).get();
    let restaurantBranches: Array<string> = restaurant.data().branches;
    if (typeof restaurant.data().branches === "number") {
        restaurantBranches = [branch.id];
    } else {
        restaurantBranches.push(branch.id);
    }
    // Update restaurant and manager doc
    await admin.firestore().collection('restaurants').doc(request.body.restaurantID).set({
        branches: restaurantBranches
    }, {merge: true});
    await admin.firestore().collection('managerx').doc(manager.id).set({
        branchID: branch.id
    }, {merge: true});

    return response.status(200).send("Branch added successfully!");
});

export const createEmployee = functions.https.onRequest(async (request, response) => {
    response.set('Access-Control-Allow-Origin', '*');

    if (request.method === 'OPTIONS') {
        // Send response to OPTIONS requests
        response.set('Access-Control-Allow-Methods', 'GET,POST');
        response.set('Access-Control-Allow-Headers', 'Content-Type');
        response.set('Access-Control-Max-Age', '3600');
        response.status(204).send('Cors Error ');
    }
    const {error} = validateEmployee(request.body);
    if (error) {
        return response.status(400).send(error.details[0].message)
    }
    const employees = await admin.firestore().collection('employeex').where("email", "==", request.body.email).get();
    if (employees.docs.length > 0) return response.status(400).send('Email already exist');

    // add employee to database
    const salt = await bcrypt.genSalt(10);
    const passwordEncrypted = await bcrypt.hash(request.body.password, salt);
    const employee = await admin.firestore().collection('employeex').add(addEmployee(request.body, passwordEncrypted));

    // add employee to specific branch
    const branch: any | undefined = await admin.firestore().collection('branches').doc(request.body.branchID).get();
    const snapshot: any = branch.data();
    const branchEmployees: Array<{ id: string, designation: string }> = snapshot.employees;
    branchEmployees.push({id: employee.id, designation: request.body.designation});

    await admin.firestore().collection('branches').doc(request.body.branchID).set({
        employees: branchEmployees
    }, {merge: true});

    return response.status(200).send('Employee added successfully');
});

export const authenticate = functions.https.onRequest(async (request: any, response: any) => {
    response.set('Access-Control-Allow-Origin', '*');

    if (request.method === 'OPTIONS') {
        // Send response to OPTIONS requests
        response.set('Access-Control-Allow-Methods', 'GET,POST');
        response.set('Access-Control-Allow-Headers', 'Content-Type');
        response.set('Access-Control-Max-Age', '3600');
        response.status(204).send('Cors Error ');
    }
    const {error} = validateAuth(request.body);
    if (error) {
        return response.status(400).send(JSON.stringify(error));
    }
    const users = await admin.firestore().collection(request.body.role).where("email", "==", request.body.email).get();
    if (users.docs.length === 0) return response.status(304).send({message: 'Invalid Email Address'});

    const userDoc = users.docs[0];
    const validPassword = await bcrypt.compare(request.body.password, userDoc.data().password);
    if (!validPassword) return response.status(304).send({message: 'Invalid Password'});

    const token = generateAuthToken({id: userDoc.id, role: request.body.role});
    return response.status(200).send(token);
});

export const createReservation = functions.https.onRequest(async (request, response) => {
    response.set('Access-Control-Allow-Origin', '*');

    if (request.method === 'OPTIONS') {
        // Send response to OPTIONS requests
        response.set('Access-Control-Allow-Methods', 'GET,POST');
        response.set('Access-Control-Allow-Headers', 'Content-Type');
        response.set('Access-Control-Max-Age', '3600');
        response.status(204).send('Cors Error ');
    }
    const {error} = validateReservation(request.body);
    if (error) {
        return response.status(400).send(error.details[0].message)
    }
    await admin.firestore().collection('reservations').add(addReservation(request.body));
    return response.status(200).send('Reservation Created Successfully');
});

export const updateReservation = functions.https.onRequest(async (request, response) => {
    response.set('Access-Control-Allow-Origin', '*');

    if (request.method === 'OPTIONS') {
        // Send response to OPTIONS requests
        response.set('Access-Control-Allow-Methods', 'GET,POST');
        response.set('Access-Control-Allow-Headers', 'Content-Type');
        response.set('Access-Control-Max-Age', '3600');
        response.status(204).send('Cors Error ');
    }
    const reservation = await admin.firestore().collection('reservations').doc(request.body.reservationID).get();
    if (!reservation.exists) return response.status(400).send('Wrong reservation doc id');

    if (request.body.newTime !== undefined) {
        await admin.firestore().collection('reservations').doc(request.body.reservationID).set({
            bookingTime: request.body.newTime
        }, {merge: true});
        return response.status(200).send('Reservation Time Updated');
    }
    if (request.body.status !== undefined && request.body.status === 'CANCELLED') {
        await admin.firestore().collection('reservations').doc(request.body.reservationID).set({
            status: request.body.status
        }, {merge: true});
        return response.status(200).send('Reservation Cancelled');
    }
    return response.status(404).send('Wrong Request Body');
});

export const getReservations = functions.https.onRequest(async (request, response) => {
    response.set('Access-Control-Allow-Origin', '*');

    if (request.method === 'OPTIONS') {
        // Send response to OPTIONS requests
        response.set('Access-Control-Allow-Methods', 'GET,POST');
        response.set('Access-Control-Allow-Headers', 'Content-Type');
        response.set('Access-Control-Max-Age', '3600');
        response.status(204).send('Cors Error ');
    }
    console.log(request.headers);
    if (request.headers.branchid === undefined) return response.status(201).send({message: 'branchid is undefined'});

    const data = await admin.firestore().collection('reservations').where('branchID', '==', request.headers.branchid).get();
    if (data.docs.length === 0) {
        return response.status(201).send({message: 'no docs'})
    }
    ;

    return response.status(200).send(data.docs);
});

export const createItem = functions.https.onRequest(async (request, response) => {
    response.set('Access-Control-Allow-Origin', '*');

    if (request.method === 'OPTIONS') {
        // Send response to OPTIONS requests
        response.set('Access-Control-Allow-Methods', 'GET,POST');
        response.set('Access-Control-Allow-Headers', 'Content-Type');
        response.set('Access-Control-Max-Age', '3600');
        response.status(204).send('Cors Error ');
    }
    const {error} = validateItem(request.body);
    console.error(JSON.stringify(error));
    if (error) {
        return response.status(400).send(JSON.stringify(error));
    }

    const branch = await admin.firestore().collection('branches').doc(request.body.branchID).get();
    if (!branch.exists) return response.status(404).send('branch does not exist');

    const items = await admin.firestore().collection('items').where('branchID', '==', request.body.branchID).where('name', '==', request.body.name).get();
    if (items.docs.length > 0) return response.status(404).send('Item with same name already present');

    await admin.firestore().collection('items').add(addItem(request.body));
    return response.status(200).send('Item Added');
});

export const updateItem = functions.https.onRequest(async (request, response) => {
    response.set('Access-Control-Allow-Origin', '*');

    if (request.method === 'OPTIONS') {
        // Send response to OPTIONS requests
        response.set('Access-Control-Allow-Methods', 'GET,POST');
        response.set('Access-Control-Allow-Headers', 'Content-Type');
        response.set('Access-Control-Max-Age', '3600');
        response.status(204).send('Cors Error ');
    }
    const item = await admin.firestore().collection('items').doc(request.body.itemID).get();
    if (!item.exists) return response.status(404).send('Item does not exist Or wrong itemID');

    const name = request.body.name;
    const description = request.body.description;
    const ratings = request.body.ratings;
    const price = request.body.price;
    const itemImage = request.body.itemImage;
    const data: any = {};

    if (name !== undefined) {
        data.name = name;
    }
    if (description !== undefined) {
        data.description = description;
    }
    if (ratings !== undefined) {
        data.ratings = ratings;
    }
    if (price !== undefined) {
        data.price = price;
    }
    if (itemImage !== undefined) {
        data.itemImage = itemImage;
    }

    await admin.firestore().collection('Items').doc(request.body.itemID).set(data, {merge: true})

    return response.status(200).send('Item Updated');
});

export const createTable = functions.https.onRequest(async (request, response) => {
    response.set('Access-Control-Allow-Origin', '*');

    if (request.method === 'OPTIONS') {
        // Send response to OPTIONS requests
        response.set('Access-Control-Allow-Methods', 'GET,POST');
        response.set('Access-Control-Allow-Headers', 'Content-Type');
        response.set('Access-Control-Max-Age', '3600');
        response.status(204).send('Cors Error ');
    }
    const {error} = validateTable(request.body);
    if (error) {
        return response.status(400).send(error.details[0].message)
    }

    const branch = await admin.firestore().collection('branches').doc(request.body.branchID).get();
    if (!branch.exists) return response.status(404).send('No branch found with BranchID');

    await admin.firestore().collection(`tables-${request.body.branchID}`).add(addTable(request.body));

    return response.status(200).send('Table Created');
});

export const createCombo = functions.https.onRequest(async (request, response) => {
    response.set('Access-Control-Allow-Origin', '*');

    if (request.method === 'OPTIONS') {
        // Send response to OPTIONS requests
        response.set('Access-Control-Allow-Methods', 'GET,POST');
        response.set('Access-Control-Allow-Headers', 'Content-Type');
        response.set('Access-Control-Max-Age', '3600');
        response.status(204).send('Cors Error ');
    }
    const {error} = validateCombos(request.body);
    if (error) {
        return response.status(400).send(error.details[0].message)
    }

    const branch = await admin.firestore().collection('branches').doc(request.body.branchID).get();
    if (!branch.exists) return response.status(404).send('No branch found with BranchID');

    const combo = await admin.firestore().collection('combos').where('branchID', '==', request.body.branchID).where('name', "==", request.body.name).get();
    if (combo.docs.length > 0) return response.status(404).send('Combos exists with same name');

    await admin.firestore().collection('combos').add(addCombo(request.body));

    return response.status(200).send('Combo Created');
});

export const createOnlineOrder = functions.https.onRequest(async (request, response) => {
    response.set('Access-Control-Allow-Origin', '*');

    if (request.method === 'OPTIONS') {
        // Send response to OPTIONS requests
        response.set('Access-Control-Allow-Methods', 'GET,POST');
        response.set('Access-Control-Allow-Headers', 'Content-Type');
        response.set('Access-Control-Max-Age', '3600');
        response.status(204).send('Cors Error ');
    }
    const {error} = validateOnlineOrder(request.body);
    if (error) {
        return response.status(400).send(error.details[0].message)
    }

    const branch = await admin.firestore().collection('branches').doc(request.body.branchID).get();
    if (!branch.exists) return response.status(404).send('No branch found with BranchID');

    await admin.firestore().collection('onlineOrders').add(addOnlineOrder(request.body));

    return response.status(200).send('Online Order Created');
});

export const createOrder = functions.https.onRequest(async (request, response) => {
    response.set('Access-Control-Allow-Origin', '*');

    if (request.method === 'OPTIONS') {
        // Send response to OPTIONS requests
        response.set('Access-Control-Allow-Methods', 'GET,POST');
        response.set('Access-Control-Allow-Headers', 'Content-Type');
        response.set('Access-Control-Max-Age', '3600');
        response.status(204).send('Cors Error ');
    }
    const {error} = validateOrder(request.body);
    if (error) {
        return response.status(400).send(error.details[0].message)
    }
    const branch = await admin.firestore().collection('branches').doc(request.body.branchID).get();
    if (!branch.exists) return response.status(404).send('No branch found with BranchID');

    await admin.firestore().collection('orders').add(addOrder(request.body));

    return response.status(200).send('Order Created');
});

// export const createInventoryItem = functions.https.onRequest(async (reguest, response) => {
//     //createInventoryItem
// });
// export const createSurplus = functions.https.onRequest(async(request, response) =>{
//     //createSurplus
//
// });

