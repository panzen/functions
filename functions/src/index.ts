import * as functions from 'firebase-functions';
import * as admin from "firebase-admin";
import * as cors from 'cors';
import {auth} from './middleware/auth';
import * as nodemailer from 'nodemailer'

const corsHandler = cors({origin: true});

import {
    validateRestaurant,
    validateOwner,
    validateBranch,
    validateEmployee,
    validateAuth,
    generateAuthToken,
    validateReservation,
    validateItem,
    validateTable,
    validateCombos,
    validateOnlineOrder,
    validateOrder,
    validateCustomer,
    validateReset,
    validateSupplier, validateCategory_unit, validateStorage, validateWastage, validateExpense
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
    addTable,
    addCombo,
    addOnlineOrder,
    addOrder,
    addCustomer,
    addSupplier,
    addCategory_unit,
    addStorage,
    addWastages,
    addExpense
} from "./objects";
import {generateKeywords} from "./Algo";

admin.initializeApp();
//user creation auth, reset
export const passwordReset = functions.https.onRequest(async (request, response) => {
    corsHandler(request, response, async () => {

        const {error} = validateReset(request.body);
        if (error) {
            return response.status(201).send(error.details[0].message)
        }
        const users = await admin.firestore().collection(request.body.role).where("email", "==", request.body.email).get();
        if (users.docs.length === 0) return response.status(201).send('Invalid Email Address');

        const Doc = users.docs[0];

        let transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: 'panzen.portal@gmail.com', // generated ethereal user
                pass: 'feBvyd-muqtek-butjy8'  // generated ethereal password
            }
        });
        try {
            let info = await transporter.sendMail({
                from: 'panzen.portal@gmail.com', // sender address
                to: Doc.data().email, // list of receivers
                subject: "Reset Password Link ✔", // Subject line
                html: "<b>Reset Link Sent Successfully</b>" // html body
            });

            console.log("Message sent: ", info.response);
            return response.status(200).send('Reset link sent to your owner');
        } catch (error) {
            return response.status(201).send(error);
        }
    });
});

export const createCustomer = functions.https.onRequest(async (request, response) => {
    corsHandler(request, response, async () => {
        const {error} = validateCustomer(request.body);
        if (error) {
            return response.status(201).send(error.details[0].message)
        }
        const customers = await admin.firestore().collection('customerx').where("email", "==", request.body.email).get();
        if (customers.docs.length > 0) return response.status(201).send('Email Already Registered');

        const salt = await bcrypt.genSalt(10);
        const passwordEncrypted = await bcrypt.hash(request.body.password, salt);

        await admin.firestore().collection('customerx').add(addCustomer(request.body, passwordEncrypted));
        return response.status(200).send("Customer Created Successfully!");
    });
});

export const createOwner = functions.https.onRequest(async (request, response) => {
    const decoded = auth(request, response);
    if (decoded === undefined) {
        return corsHandler(request, response, async () => {
            const {error} = validateOwner(request.body);
            if (error) {
                return response.status(201).send(error.details[0].message)
            }
            const owners = await admin.firestore().collection('ownerx').where("email", "==", request.body.email).get();
            if (owners.docs.length > 0) return response.status(201).send('Email Already Registered');

            const salt = await bcrypt.genSalt(10);
            const passwordEncrypted = await bcrypt.hash(request.body.password, salt);

            await admin.firestore().collection('ownerx').add(addOwner(request.body, passwordEncrypted));
            return response.status(200).send("Owner Created Successfully!");
        });
    }
    return response.status(201).send(decoded);
});

export const createRestaurant = functions.https.onRequest(async (request, response) => {
    const decoded = auth(request, response);
    if (decoded === undefined) {
        return corsHandler(request, response, async () => {
            const {error} = validateRestaurant(request.body);
            if (error) {
                return response.status(201).send(error.details[0].message)
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
    }
    return response.status(201).send(decoded);
});

export const createBranch = functions.https.onRequest(async (request, response) => {
    const decoded = auth(request, response);
    if (decoded === undefined) {
        return corsHandler(request, response, async () => {
            const {error} = validateBranch(request.body);
            if (error) {
                return response.status(201).send(error.details[0].message)
            }
            const branches = await admin.firestore().collection('branches').where("email", "==", request.body.email).get();
            if (branches.docs.length > 0) return response.status(201).send('Branch exists with same email');

            // Create Branch Manager
            const managerBody = request.body.manager;
            const managers = await admin.firestore().collection('managerx').where("email", "==", managerBody.email).get();
            if (managers.docs.length > 0) return response.status(201).send('Manager exists with same email');

            const salt = await bcrypt.genSalt(10);
            const passwordEncrypted = await bcrypt.hash(managerBody.password, salt);

            const manager = await admin.firestore().collection('managerx').add(addManager(managerBody, passwordEncrypted));
            if (manager.id === undefined) return response.status(201).send('Server Error Retry');

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
    }
    return response.status(201).send(decoded);
});

export const authenticate = functions.https.onRequest(async (request: any, response: any) => {
    return corsHandler(request, response, async () => {
        const {error} = validateAuth(request.body);
        if (error) {
            return response.status(201).send(error.details[0].message);
        }
        const users = await admin.firestore().collection(request.body.role).where("email", "==", request.body.email).get();
        if (users.docs.length === 0) return response.status(201).send('Invalid Email Address');

        const userDoc = users.docs[0];
        const validPassword = await bcrypt.compare(request.body.password, userDoc.data().password);
        if (!validPassword) return response.status(201).send('Invalid Password');

        const token = generateAuthToken({id: userDoc.id, role: request.body.role});
        return response.status(200).send(token);
    });
});


//reservation
export const createReservation = functions.https.onRequest(async (request, response) => {
    return corsHandler(request, response, async () => {
        const decoded = auth(request, response);
        if (decoded === undefined) {
            const {error} = validateReservation(request.body);
            if (error) {
                return response.status(201).send(error.details[0].message)
            }
            let keywords: Array<string> = generateKeywords(request.body.customerName).concat(generateKeywords(request.body.customerContact));
            console.log(keywords, 'keywords');

            await admin.firestore().collection('reservations').add(addReservation(request.body, keywords));
            return response.status(200).send('Reservation Created Successfully');
        }
        return response.status(201).send(decoded);
    });
});

export const updateReservation = functions.https.onRequest(async (request, response) => {
    return corsHandler(request, response, async () => {
        const decoded = auth(request, response);
        if (decoded === undefined) {
            const reservation = await admin.firestore().collection('reservations').doc(request.body.reservationID).get();
            if (!reservation.exists) return response.status(201).send('Wrong reservation doc id');

            if (request.body.newTime !== undefined) {
                await admin.firestore().collection('reservations').doc(request.body.reservationID).set({
                    reservationTime: request.body.newTime
                }, {merge: true});
                return response.status(200).send('Reservation Time Updated');
            }
            if (request.body.status !== undefined && request.body.status === 'CANCELLED') {
                await admin.firestore().collection('reservations').doc(request.body.reservationID).set({
                    status: request.body.status
                }, {merge: true});
                return response.status(200).send('Reservation Cancelled');
            }
            return response.status(201).send('Wrong Request Body');
        }
        return response.status(201).send(decoded);
    });

});

export const getReservations = functions.https.onRequest((request, response) => {
    return corsHandler(request, response, async () => {
        const decoded = auth(request, response);
        if (decoded === undefined) {
            if (request.headers.branchid === undefined || request.headers.filterdate === undefined) return response.status(201).send('branchId is undefined');
            const data = await admin.firestore()
                .collection('reservations')
                .where('branchID', '==', request.headers.branchid)
                .where('status', '==', 'RESERVED')
                .where('reservationDate', '==', request.headers.filterdate)
                .limit(10)
                .get();
            if (data.docs.length === 0) {
                return response.status(200).send([]);
            }
            const list: any = [];
            data.docs.map(el => list.push({id: el.id, data: el.data()}));

            return response.status(200).send(list);
        }
        return response.status(201).send(decoded);
    })
});


//onlineorder
export const createOnlineOrder = functions.https.onRequest(async (request, response) => {
    return corsHandler(request, response, async () => {
        const decoded = auth(request, response);
        if (decoded === undefined) {
            const {error} = validateOnlineOrder(request.body);
            if (error) {
                return response.status(201).send(error.details[0].message)
            }
            const branch = await admin.firestore().collection('branches').doc(request.body.branchID).get();
            if (!branch.exists) return response.status(201).send('No branch found with BranchID');

            await admin.firestore().collection('onlineOrders').add(addOnlineOrder(request.body, new Date()));

            return response.status(200).send('Online Order Created');
        }
        return response.status(201).send(decoded);
    });
});

export const getOnlineOrder = functions.https.onRequest(async (request, response) => {
    return corsHandler(request, response, async () => {
        const decoded = auth(request, response);
        if (decoded === undefined) {
            if (request.headers.branchid === undefined) return response.status(201).send('branchid is undefined');

            const onlineOrders = await admin.firestore()
                .collection('onlineOrders')
                .where('branchID', '==', request.headers.branchid)
                .where('createdDate', '==', request.headers.filterdate)
                .where('status', '==', request.headers.status)
                .limit(10)
                .get();
            if (onlineOrders.docs.length === 0) return response.status(200).send([]);

            const list: any = [];
            onlineOrders.docs.map(el => list.push({id: el.id, data: el.data()}));

            return response.status(200).send(list);
        }
        return response.status(201).send(decoded);
    });
});

export const updateOnlineOrder = functions.https.onRequest(async (request, response) => {
    return corsHandler(request, response, async () => {
        const decoded = auth(request, response);
        if (decoded === undefined) {
            const onlineOrder = await admin.firestore().collection('onlineOrders').doc(request.body.onlineorderID).get();
            if (!onlineOrder.exists) return response.status(201).send('Wrong Online Order doc id');

            if (request.body.status !== undefined) {
                await admin.firestore().collection('onlineOrders').doc(request.body.onlineorderID).set({
                    status: request.body.status
                }, {merge: true});
                return response.status(200).send('Online Order ' + request.body.status);
            }
            return response.status(201).send('Wrong Request Body');
        }
        return response.status(201).send(decoded);
    });

});


//menu item
export const getSingleItem = functions.https.onRequest(async (request, response) => {
        return corsHandler(request, response, async () => {
            const decoded = auth(request, response);
            if (decoded) {
            if (request.headers.id === undefined) {
                return response.status(201).send('No id in header');
            }
            const item = await admin.firestore().collection('Items').doc(request.headers.id.toString()).get();
            if (!item.exists) return response.status(201).send('No Items in database with id');

            return response.status(200).send({id: item.id, data: item.data()});
            }
            return response.status(201).send(decoded);
        });
});

export const createItem = functions.https.onRequest(async (request, response) => {

    return corsHandler(request, response, async () => {
        const decoded = auth(request, response);
        if (decoded === undefined) {
            const {error} = validateItem(request.body);
            if (error) {
                return response.status(201).send(JSON.stringify(error));
            }

            const branch = await admin.firestore().collection('branches').doc(request.body.branchID).get();
            if (!branch.exists) return response.status(201).send('branch does not exist');

            const items = await admin.firestore()
                .collection('Items')
                .where('branchID', '==', request.body.branchID)
                .where('name', '==', request.body.name)
                .get();
            if (items.docs.length > 0) return response.status(201).send('Item with same name already present');

            let keywords: Array<string> = generateKeywords(request.body.name);

            await admin.firestore().collection('Items').add(addItem(request.body, keywords));
            return response.status(200).send('Item Added');
        }
        return response.status(201).send(decoded);
    });

});

export const updateItem = functions.https.onRequest(async (request, response) => {
    return corsHandler(request, response, async () => {
        const decoded = auth(request, response);
        if (decoded === undefined) {
            console.log('itemData', JSON.stringify(request.body));
            const item = await admin.firestore().collection('Items').doc(request.body.itemID).get();
            if (!item.exists) return response.status(201).send('Item does not exist Or wrong itemID');

            const name = request.body.name;
            const description = request.body.description;
            const ratings = request.body.ratings;
            const price = request.body.price;
            const itemImage = request.body.itemImage;
            const favorite = request.body.favorite;
            const ingredients: Array<{ id: string, name: string, quantity: string, UOF: string }> = request.body.ingredients;
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
            if (ingredients !== undefined) {
                data.ingredients = ingredients
            }
            if (favorite !== undefined) {
                data.favorite = favorite
            }

            await admin.firestore().collection('Items').doc(request.body.itemID).set(data, {merge: true});

            return response.status(200).send('Item Updated');
        }
        return response.status(201).send(decoded);
    });
});

export const getItems = functions.https.onRequest(async (request, response) => {
    return corsHandler(request, response, async () => {
        const decoded = auth(request, response);
        if (decoded === undefined) {
            // @ts-ignore
            let items: FirebaseFirestore.QuerySnapshot<FirebaseFirestore.DocumentData> = null;
            if (request.headers.branchid === undefined) {
                return response.status(201).send('No branchid in header');
            }
            console.log('data', JSON.stringify(request.headers));
            if (request.headers.favorite === undefined
                && request.headers.category === undefined
                && request.headers.sortby === undefined) {
                items = await admin.firestore()
                    .collection('Items')
                    .where('branchID', "==", request.headers.branchid)
                    .where('status', '==', request.headers.status)
                    .get();
            } else if (request.headers.favorite !== undefined
                && request.headers.category !== undefined
                && request.headers.sortby === undefined) {
                items = await admin.firestore()
                    .collection('Items')
                    .where('branchID', "==", request.headers.branchid)
                    .where('status', '==', request.headers.status)
                    .where('category', '==', request.headers.category)
                    .where('favorite', '==', request.headers.favorite)
                    .get();
            } else if (request.headers.favorite === undefined
                && request.headers.category !== undefined
                && request.headers.sortby === undefined) {
                items = await admin.firestore()
                    .collection('Items')
                    .where('branchID', "==", request.headers.branchid)
                    .where('status', '==', request.headers.status)
                    .where('category', '==', request.headers.category)
                    .get();
            } else if (request.headers.favorite === undefined
                && request.headers.category === undefined
                && request.headers.sortby !== undefined) {
                items = await admin.firestore()
                    .collection('Items')
                    .where('branchID', "==", request.headers.branchid)
                    .where('status', '==', request.headers.status)
                    .orderBy(`${request.headers.sortby}`, "asc")
                    .limit(10)
                    .get();
            }
            if (items.docs.length === 0) return response.status(200).send([]);

            const list: any = [];
            items.docs.map(el => list.push({id: el.id, data: el.data()}));
            return response.status(200).send(list);
        }
        return response.status(201).send(decoded);
    });
});


//combo
export const createCombo = functions.https.onRequest(async (request, response) => {

    return corsHandler(request, response, async () => {
        const decoded = auth(request, response);
        if (decoded === undefined) {
            const {error} = validateCombos(request.body);
            if (error) {
                return response.status(201).send(error.details[0].message)
            }
            const branch = await admin.firestore().collection('branches').doc(request.body.branchID).get();
            if (!branch.exists) return response.status(201).send('No branch found with BranchID');

            const combo = await admin.firestore()
                .collection('combos')
                .where('branchID', '==', request.body.branchID)
                .where('name', "==", request.body.name)
                .get();
            if (combo.docs.length > 0) return response.status(201).send('Combos exists with same name');
            let keywords: Array<string> = generateKeywords(request.body.name);

            await admin.firestore().collection('combos').add(addCombo(request.body, keywords));

            return response.status(200).send('Combo Created');
        }
        return response.status(201).send(decoded);
    });

});

export const getCombos = functions.https.onRequest(async (request, response) => {

    return corsHandler(request, response, async () => {
        const decoded = auth(request, response);
        if (decoded === undefined) {
            if (request.headers.branchid === undefined) {
                return response.status(201).send('No branchID in header');
            }
            const combos = await admin.firestore()
                .collection('combos')
                .where('branchID', "==", request.headers.branchid)
                .where('status', '==', request.body.status)
                .limit(10)
                .get();
            if (combos.docs.length === 0) return response.status(201).send('No combos in database');
            const list: any = [];
            combos.docs.map(el => list.push({id: el.id, data: el.data()}));
            return response.status(200).send(list);
        }
        return response.status(201).send(decoded);
    });

});

export const updateCombos = functions.https.onRequest(async (request, response) => {

    return corsHandler(request, response, async () => {
        const decoded = auth(request, response);
        if (decoded === undefined) {
            const combo = await admin.firestore().collection('combos').doc(request.body.comboID).get();
            if (!combo.exists) return response.status(201).send('combo does not exist Or wrong comboID');

            const name = request.body.name;
            const description = request.body.description;
            const ratings = request.body.ratings;
            const price = request.body.price;
            const items = request.body.items;
            const status = request.body.status;
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
            if (items !== undefined) {
                data.items = items;
            }
            if (status !== undefined) {
                data.status = status
            }

            await admin.firestore().collection('combos').doc(request.body.comboID).set(data, {merge: true});

            return response.status(200).send('Combo Updated');
        }
        return response.status(201).send(decoded);
    });

});


//table
export const createTable = functions.https.onRequest(async (request, response) => {

        return corsHandler(request, response, async () => {
            const decoded = auth(request, response);
            if (decoded === undefined) {
            const {error} = validateTable(request.body);
            if (error) {
                return response.status(201).send(error.details[0].message)
            }

            const branch = await admin.firestore().collection('branches').doc(request.body.branchID).get();
            if (!branch.exists) return response.status(201).send('No branch found with BranchID');

            await admin.firestore().collection(`tables-${request.body.branchID}`).add(addTable(request.body));

            return response.status(200).send('Table Created');
            }
            return response.status(201).send(decoded);
        });

});

export const updateTable = functions.https.onRequest(async (request, response) => {

        return corsHandler(request, response, async () => {
            const decoded = auth(request, response);
            if (decoded === undefined) {
            const table = await admin.firestore().collection(`tables-${request.body.branchID}`).doc(request.body.tableID).get();
            if (!table.exists) return response.status(201).send('Table does not exist Or wrong tableId');
            if (request.body.delete === true) {
                await admin.firestore().collection(`tables-${request.body.branchID}`).doc(request.body.tableID).delete();
                return response.status(201).send('Table deleted');
            }
            //@ts-ignore
            if (table.data().number === request.body.number) return response.status(201).send('Table exist with same number');
            const number = request.body.number;
            const maintenance = request.body.maintenance;
            const captainAssigned = request.body.captainAssigned;
            const data: any = {};

            if (number !== undefined) {
                data.number = number;
            }
            if (maintenance !== undefined) {
                data.maintenance = maintenance;
            }
            if (captainAssigned !== undefined) {
                data.captainAssigned = captainAssigned;
            }

            await admin.firestore().collection(`tables-${request.body.branchID}`).doc(request.body.tableID).set(data, {merge: true});

            return response.status(200).send('Table Updated');
            }
            return response.status(201).send(decoded);
        });

});


//order
export const createOrder = functions.https.onRequest(async (request, response) => {

        return corsHandler(request, response, async () => {
            const decoded = auth(request, response);
            if (decoded === undefined) {
            const {error} = validateOrder(request.body);
            if (error) {
                return response.status(201).send(error.details[0].message)
            }
            const branch = await admin.firestore().collection('branches').doc(request.body.branchID).get();
            if (!branch.exists) return response.status(201).send('No branch found with BranchID');

            await admin.firestore().collection('orders').add(addOrder(request.body));

            return response.status(200).send('Order Created');
            }
            return response.status(201).send(decoded);
        });

});


//supplier
export const createSupplier = functions.https.onRequest(async (request, response) => {

    return corsHandler(request, response, async () => {
        const decoded = auth(request, response);
        if (decoded === undefined) {
            const {error} = validateSupplier(request.body);
            if (error) {
                return response.status(201).send(JSON.stringify(error));
            }

            const branch = await admin.firestore().collection('branches').doc(request.body.branchID).get();
            if (!branch.exists) return response.status(201).send('branch does not exist');

            const suppliers = await admin.firestore()
                .collection('Suppliers')
                .where('branchID', '==', request.body.branchID)
                .where('email', '==', request.body.email)
                .get();
            if (suppliers.docs.length > 0) return response.status(201).send('Supplier with same email already present');

            let keywords: Array<string> = generateKeywords(request.body.fullName).concat(generateKeywords(request.body.contactNumber)).concat(generateKeywords(request.body.email));

            await admin.firestore().collection('Suppliers').add(addSupplier(request.body, keywords));
            return response.status(200).send('Supplier Added');
        }
        return response.status(201).send(decoded);
    });

});

export const getSuppliers = functions.https.onRequest(async (request, response) => {
    return corsHandler(request, response, async () => {
        const decoded = auth(request, response);
        if (decoded === undefined) {
            if (request.headers.branchid === undefined) {
                return response.status(201).send('No branchid in header');
            }
            const suppliers = await admin.firestore()
                .collection('Suppliers')
                .where('branchID', "==", request.headers.branchid)
                .limit(10)
                .get();

            if (suppliers.docs.length === 0) return response.status(201).send('No Suppliers in database');

            const list: any = [];
            suppliers.docs.map(el => list.push({id: el.id, data: el.data()}));
            return response.status(200).send(list);
        }
        return response.status(201).send(decoded);
    });
});

export const updateSuppliers = functions.https.onRequest(async (request, response) => {

        return corsHandler(request, response, async () => {
            const decoded = auth(request, response);
            if (decoded === undefined) {
            const supplier = await admin.firestore().collection('Suppliers').doc(request.body.supplierID).get();
            if (!supplier.exists) return response.status(201).send('Supplier does not exist Or wrong supplierID');

            const fullName = request.body.fullName;
            const contactNumber = request.body.contactNumber;
            const email = request.body.email;
            const rawItems = request.body.rawItems;
            const accountDetails = request.body.accountDetails;
            const method = request.body.method;
            const status = request.body.status;
            if (status !== undefined && status === 'DELETE') {
                await admin.firestore().collection('Suppliers').doc(request.body.supplierID).delete();
                return response.status(200).send('Supplier Deleted');
            }
            const data: any = {};

            if (fullName !== undefined) {
                data.fullName = fullName;
            }
            if (contactNumber !== undefined) {
                data.contactNumber = contactNumber;
            }
            if (email !== undefined) {
                data.email = email;
            }
            if (rawItems !== undefined) {
                data.price = rawItems;
            }
            if (accountDetails !== undefined) {
                data.itemImage = accountDetails;
            }
            if (method !== undefined) {
                data.method = method
            }
            await admin.firestore().collection('Suppliers').doc(request.body.supplierID).set(data, {merge: true});

            return response.status(200).send('Supplier Updated');
            }
            return response.status(201).send(decoded);
        });

});


//Employees
export const createEmployee = functions.https.onRequest(async (request, response) => {

        return corsHandler(request, response, async () => {
            const decoded = auth(request, response);
            if (decoded === undefined) {
            const {error} = validateEmployee(request.body);
            if (error) {
                return response.status(201).send(error.details[0].message)
            }
            const employees = await admin.firestore()
                .collection('employeex')
                .where("email", "==", request.body.email).get();
            if (employees.docs.length > 0) return response.status(201).send('Email already exist');

            // add employee to database
            const salt = await bcrypt.genSalt(10);
            const passwordEncrypted = await bcrypt.hash(request.body.password, salt);
            const keywords: Array<string> = generateKeywords(request.body.fullName).concat(generateKeywords(request.body.contactNumber)).concat(generateKeywords(request.body.email));

            const employee = await admin.firestore().collection('employeex').add(addEmployee(request.body, passwordEncrypted, keywords));

            // add employee to specific branch
            const branch: any | undefined = await admin.firestore().collection('branches').doc(request.body.branchID).get();
            const snapshot: any = branch.data();
            const branchEmployees: Array<{ id: string, designation: string }> = snapshot.employees;
            branchEmployees.push({id: employee.id, designation: request.body.designation});

            await admin.firestore().collection('branches').doc(request.body.branchID).set({
                employees: branchEmployees
            }, {merge: true});

            return response.status(200).send('Employee added successfully');
            }
            return response.status(201).send(decoded);
        });

});

export const getEmployees = functions.https.onRequest(async (request, response) => {
    return corsHandler(request, response, async () => {
        const decoded = auth(request, response);
        if (decoded === undefined) {
            if (request.headers.branchid === undefined) {
                return response.status(201).send('No branchid in header');
            }
            const employees = await admin.firestore()
                .collection('employeex')
                .where('branchID', "==", request.headers.branchid)
                .orderBy('fullName', "asc")
                .limit(10)
                .get();

            if (employees.docs.length === 0) return response.status(201).send('No Employees in database');

            const list: any = [];
            employees.docs.map(el => list.push({id: el.id, data: el.data()}));
            return response.status(200).send(list);
        }
        return response.status(201).send(decoded);
    });
});

export const updateEmployees = functions.https.onRequest(async (request, response) => {

        return corsHandler(request, response, async () => {
            const decoded = auth(request, response);
            if (decoded === undefined) {
            const employee = await admin.firestore().collection('employeex').doc(request.body.employeeID).get();
            if (!employee.exists) return response.status(201).send('Employee does not exist Or wrong employeeID');

            const fullName = request.body.fullName;
            const contactNumber = request.body.contactNumber;
            const email = request.body.email;
            const address = request.body.address;
            const accountDetails = request.body.accountDetails;
            const designation = request.body.designation;
            const status = request.body.status;
            const payScale = request.body.payScale;
            const employementType = request.body.employementType;

            if (status !== undefined && status === 'TERMINATE') {
                await admin.firestore().collection('employeex').doc(request.body.employeeID).delete();
                return response.status(200).send('Employee Deleted');
            }
            const data: any = {};

            if (fullName !== undefined) {
                data.fullName = fullName;
            }
            if (contactNumber !== undefined) {
                data.contactNumber = contactNumber;
            }
            if (email !== undefined) {
                data.email = email;
            }
            if (address !== undefined) {
                data.address = address;
            }
            if (accountDetails !== undefined) {
                data.accountDetails = accountDetails;
            }
            if (designation !== undefined) {
                data.designation = designation
            }
            if (payScale !== undefined) {
                data.designation = payScale
            }
            if (employementType !== undefined) {
                data.employementType = employementType
            }
            await admin.firestore().collection('employeex').doc(request.body.employeeID).set(data, {merge: true});

            return response.status(200).send('Employee Updated');
            }
            return response.status(201).send(decoded);
        });

});

//raw Item


//Inventory Item


//category / unit
export const createCategories = functions.https.onRequest(async (request, response) => {
    return corsHandler(request, response, async () => {
        const decoded = auth(request, response);
        if (decoded === undefined) {
            const {error} = validateCategory_unit(request.body);
            if (error) {
                return response.status(201).send(JSON.stringify(error));
            }

            const branch = await admin.firestore().collection('branches').doc(request.body.branchID).get();
            if (!branch.exists) return response.status(201).send('branch does not exist');

            const categories = await admin.firestore()
                .collection('RICategories')
                .where('branchID', '==', request.body.branchID)
                .where('name', '==', request.body.name)
                .get();
            if (categories.docs.length > 0) return response.status(201).send('Category with same name already present');


            await admin.firestore().collection('RICategories').add(addCategory_unit(request.body));
            return response.status(200).send('Category Added');
        }
        return response.status(201).send(decoded);
    });
});

export const getCategories = functions.https.onRequest(async (request, response) => {
    return corsHandler(request, response, async () => {
        const decoded = auth(request, response);
        if (decoded === undefined) {
            if (request.headers.branchid === undefined) {
                return response.status(201).send('No branchid in header');
            }
            const categories = await admin.firestore()
                .collection('RICategories')
                .where('branchID', "==", request.headers.branchid)
                .limit(10)
                .get();

            if (categories.docs.length === 0) return response.status(201).send('No categories in database');

            const list: any = [];
            categories.docs.map(el => list.push({id: el.id, data: el.data()}));
            return response.status(200).send(list);
        }
        return response.status(201).send(decoded);
    });
});

export const createUnit = functions.https.onRequest(async (request, response) => {
    return corsHandler(request, response, async () => {
        const decoded = auth(request, response);
        if (decoded === undefined) {
            const {error} = validateCategory_unit(request.body);
            if (error) {
                return response.status(201).send(JSON.stringify(error));
            }

            const branch = await admin.firestore().collection('branches').doc(request.body.branchID).get();
            if (!branch.exists) return response.status(201).send('branch does not exist');

            const categories = await admin.firestore()
                .collection('Units')
                .where('branchID', '==', request.body.branchID)
                .where('name', '==', request.body.name)
                .get();
            if (categories.docs.length > 0) return response.status(201).send('Unit with same name already present');


            await admin.firestore().collection('Units').add(addCategory_unit(request.body));
            return response.status(200).send('Unit Added');
        }
        return response.status(201).send(decoded);
    });
});

export const getUnits = functions.https.onRequest(async (request, response) => {
    return corsHandler(request, response, async () => {
        const decoded = auth(request, response);
        if (decoded === undefined) {
            if (request.headers.branchid === undefined) {
                return response.status(201).send('No branchid in header');
            }
            const Units = await admin.firestore()
                .collection('Units')
                .where('branchID', "==", request.headers.branchid)
                .limit(10)
                .get();

            if (Units.docs.length === 0) return response.status(201).send('No Units in database');

            const list: any = [];
            Units.docs.map(el => list.push({id: el.id, data: el.data()}));
            return response.status(200).send(list);
        }
        return response.status(201).send(decoded);
    });
});


//storage
export const createStorage = functions.https.onRequest(async (request, response) => {
    return corsHandler(request, response, async () => {
        const decoded = auth(request, response);
        if (decoded === undefined) {
            const {error} = validateStorage(request.body);
            if (error) {
                return response.status(201).send(JSON.stringify(error));
            }

            const branch = await admin.firestore().collection('branches').doc(request.body.branchID).get();
            if (!branch.exists) return response.status(201).send('branch does not exist');

            const storages = await admin.firestore()
                .collection('Storages')
                .where('branchID', '==', request.body.branchID)
                .where('name', '==', request.body.name)
                .get();
            if (storages.docs.length > 0) return response.status(201).send('Storage with same name already present');


            await admin.firestore().collection('Storages').add(addStorage(request.body));
            return response.status(200).send('Storage Added');
        }
        return response.status(201).send(decoded);
    });
});

export const getStorages = functions.https.onRequest(async (request, response) => {
    return corsHandler(request, response, async () => {
        const decoded = auth(request, response);
        if (decoded === undefined) {
            if (request.headers.branchid === undefined) {
                return response.status(201).send('No branchid in header');
            }
            const storages = await admin.firestore()
                .collection('Storages')
                .where('branchID', "==", request.headers.branchid)
                .limit(10)
                .get();

            if (storages.docs.length === 0) return response.status(201).send('No Storages in database');

            const list: any = [];
            storages.docs.map(el => list.push({id: el.id, data: el.data()}));
            return response.status(200).send(list);
        }
        return response.status(201).send(decoded);
    });
});

export const updateStorage = functions.https.onRequest(async (request, response) => {

        return corsHandler(request, response, async () => {
            const decoded = auth(request, response);
            if (decoded === undefined) {
            const supplier = await admin.firestore().collection('Storages').doc(request.body.storageID).get();
            if (!supplier.exists) return response.status(201).send('Storages does not exist Or wrong storageID');

            const employeeIncharge = request.body.employeeIncharge;
            const status = request.body.status;
            if (status !== undefined && status === 'DELETE') {
                await admin.firestore().collection('Storages').doc(request.body.storageID).delete();
                return response.status(200).send('Storage Deleted');
            }
            const data: any = {};

            if (employeeIncharge !== undefined) {
                data.employeeIncharge = employeeIncharge;
            }
            await admin.firestore().collection('Storages').doc(request.body.storageID).set(data, {merge: true});

            return response.status(200).send('Storage Updated');
        }
        return response.status(201).send(decoded);
        });

});


//wastage
export const createWastage = functions.https.onRequest(async (request, response) => {
    return corsHandler(request, response, async () => {
        const decoded = auth(request, response);
        if (decoded === undefined) {
            const {error} = validateWastage(request.body);
            if (error) {
                return response.status(201).send(JSON.stringify(error));
            }
            const branch = await admin.firestore().collection('branches').doc(request.body.branchID).get();
            if (!branch.exists) return response.status(201).send('branch does not exist');

            await admin.firestore().collection('Wastages').add(addWastages(request.body, 'Not_sure'));
            return response.status(200).send('Wastage Added');
        }
        return response.status(201).send(decoded);
    });
});

export const getWastages = functions.https.onRequest(async (request, response) => {
    return corsHandler(request, response, async () => {
        const decoded = auth(request, response);
        if (decoded === undefined) {
            if (request.headers.branchid === undefined) {
                return response.status(201).send('No branchid in header');
            }
            const wastages = await admin.firestore()
                .collection('Wastages')
                .where('branchID', "==", request.headers.branchid)
                .limit(10)
                .get();

            if (wastages.docs.length === 0) return response.status(201).send([]);

            const list: any = [];
            wastages.docs.map(el => list.push({id: el.id, data: el.data()}));
            return response.status(200).send(list);
        }
        return response.status(201).send(decoded);
    });
});


//surplus


//expense
export const createExpense = functions.https.onRequest(async (request, response) => {
    return corsHandler(request, response, async () => {
        const decoded = auth(request, response);
        if (decoded === undefined) {
            const {error} = validateExpense(request.body);
            if (error) {
                return response.status(201).send(JSON.stringify(error));
            }
            const branch = await admin.firestore().collection('branches').doc(request.body.branchID).get();
            if (!branch.exists) return response.status(201).send('branch does not exist');
            const keywords: Array<string> = generateKeywords(request.body.category);

            await admin.firestore().collection('Expenses').add(addExpense(request.body, keywords));
            return response.status(200).send('Expense Added');
        }
        return response.status(201).send(decoded);
    });
});

export const getExpenses = functions.https.onRequest(async (request, response) => {
    return corsHandler(request, response, async () => {
        const decoded = auth(request, response);
        if (decoded === undefined) {
            if (request.headers.branchid === undefined) {
                return response.status(201).send('No branchid in header');
            }
            const expenses = await admin.firestore()
                .collection('Expenses')
                .where('branchID', "==", request.headers.branchid)
                .limit(10)
                .get();

            if (expenses.docs.length === 0) return response.status(201).send([]);

            const list: any = [];
            expenses.docs.map(el => list.push({id: el.id, data: el.data()}));
            return response.status(200).send(list);
        }
        return response.status(201).send(decoded);
    });
});


//SEARCH QUERIES ONLY

export const searchReservations = functions.https.onRequest((request, response) => {
    return corsHandler(request, response, async () => {
        const decoded = auth(request, response);
        if (decoded === undefined) {
            if (request.headers.branchid === undefined || request.headers.keystring === undefined) return response.status(201).send('branchId is undefined');
            const data = await admin.firestore()
                .collection('reservations')
                .where('branchID', '==', request.headers.branchid)
                .where('status', '==', 'RESERVED')
                .where('keywords', 'array-contains', request.headers.keystring)
                .limit(10)
                .get();
            if (data.docs.length === 0) {
                return response.status(200).send([]);
            }
            const list: any = [];
            data.docs.map(el => list.push({id: el.id, data: el.data()}));

            return response.status(200).send(list);
        }
        return response.status(201).send(decoded);
    })
});

export const searchMenuItems = functions.https.onRequest((request, response) => {
    return corsHandler(request, response, async () => {
        const decoded = auth(request, response);
        if (decoded === undefined) {
            if (request.headers.branchid === undefined || request.headers.keystring === undefined) return response.status(201).send('branchId is undefined');
            const data = await admin.firestore()
                .collection('onlineOrders')
                .where('branchID', '==', request.headers.branchid)
                .where('keywords', 'array-contains', request.headers.keystring)
                .limit(10)
                .get();
            if (data.docs.length === 0) {
                return response.status(200).send([]);
            }
            const list: any = [];
            data.docs.map(el => list.push({id: el.id, data: el.data()}));

            return response.status(200).send(list);
        }
        return response.status(201).send(decoded);
    })
});

export const searchCombos = functions.https.onRequest((request, response) => {
    return corsHandler(request, response, async () => {
        const decoded = auth(request, response);
        if (decoded === undefined) {
            if (request.headers.branchid === undefined || request.headers.keystring === undefined) return response.status(201).send('branchId is undefined');
            const data = await admin.firestore()
                .collection('combos')
                .where('branchID', '==', request.headers.branchid)
                .where('keywords', 'array-contains', request.headers.keystring)
                .limit(10)
                .get();
            if (data.docs.length === 0) {
                return response.status(200).send([]);
            }
            const list: any = [];
            data.docs.map(el => list.push({id: el.id, data: el.data()}));

            return response.status(200).send(list);
        }
        return response.status(201).send(decoded);
    })
});

export const searchSuppliers = functions.https.onRequest((request, response) => {
    return corsHandler(request, response, async () => {
        const decoded = auth(request, response);
        if (decoded === undefined) {
            if (request.headers.branchid === undefined || request.headers.keystring === undefined) return response.status(201).send('branchId is undefined');
            const data = await admin.firestore()
                .collection('Suppliers')
                .where('branchID', '==', request.headers.branchid)
                .where('keywords', 'array-contains', request.headers.keystring)
                .limit(10)
                .get();
            if (data.docs.length === 0) {
                return response.status(200).send([]);
            }
            const list: any = [];
            data.docs.map(el => list.push({id: el.id, data: el.data()}));

            return response.status(200).send(list);
        }
        return response.status(201).send(decoded);
    })
});

export const searchExpenses = functions.https.onRequest((request, response) => {
    return corsHandler(request, response, async () => {
        const decoded = auth(request, response);
        if (decoded === undefined) {
            if (request.headers.branchid === undefined || request.headers.keystring === undefined) return response.status(201).send('branchId is undefined');
            const data = await admin.firestore()
                .collection('Expenses')
                .where('branchID', '==', request.headers.branchid)
                .where('keywords', 'array-contains', request.headers.keystring)
                .limit(10)
                .get();
            if (data.docs.length === 0) {
                return response.status(200).send([]);
            }
            const list: any = [];
            data.docs.map(el => list.push({id: el.id, data: el.data()}));

            return response.status(200).send(list);
        }
        return response.status(201).send(decoded);
    })
});

export const searchEmployees = functions.https.onRequest((request, response) => {
    return corsHandler(request, response, async () => {
        const decoded = auth(request, response);
        if (decoded === undefined) {
            if (request.headers.branchid === undefined || request.headers.keystring === undefined) return response.status(201).send('branchId is undefined');
            const data = await admin.firestore()
                .collection('employeex')
                .where('branchID', '==', request.headers.branchid)
                .where('keywords', 'array-contains', request.headers.keystring)
                .limit(10)
                .get();
            if (data.docs.length === 0) {
                return response.status(200).send([]);
            }
            const list: any = [];
            data.docs.map(el => list.push({id: el.id, data: el.data()}));

            return response.status(200).send(list);
        }
        return response.status(201).send(decoded);
    })
});
