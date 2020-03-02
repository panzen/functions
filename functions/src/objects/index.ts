import * as admin from "firebase-admin";

type location = {
    lat: number,
    long: number,
    address: string,
    city: string,
    State: string,
    Country: string,
    PinCode: number,
    CountryCode: string
};

export const addManager = function (body: {
    fullName: string,
    email: string,
    ownerID: string,
    restaurantID: string,
    branchID: string,
    contactNumber: string,
    profilePic: string
}, passwordEncrypted: string) {
    return {
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        fullName: body.fullName,
        email: body.email,
        password: passwordEncrypted,
        ownerID: body.ownerID,
        restaurantID: body.restaurantID,
        profilePic: body.profilePic,
        contactNumber: body.contactNumber
    };
};

export const addOwner = function (body: {
    fullName: string,
    contactNumber: string,
    email: string,
    alternateEmail: string,
    alternateContactNumber: string,
    location: location,
    restaurantID: string,
}, passwordEncrypted: string) {
    return {
        fullName: body.fullName,
        contactNumber: body.contactNumber,
        email: body.email,
        password: passwordEncrypted,
        alternateEmail: body.alternateEmail,
        alternateContactNumber: body.alternateContactNumber,
        location: body.location,
        restaurantID: body.restaurantID,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
    }
};

export const addRestaurant = function (body: {
    name: string,
    email: string,
    subscription: {
        packageName: string,
        startDate: Date,
        endDate: Date
    },
    contactNumber: string,
    officeLocation: location,
    ownerID: string,
    branches: Array<string> | number

},) {
    return {
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        name: body.name,
        email: body.email,
        ownerID: body.ownerID,
        subscription: body.subscription,
        contactNumber: body.contactNumber,
        officeLocation: body.officeLocation,
        branches: body.branches
    };
};

export const addBranch = function (body: {
    branchName: string,
    location: location,
    email: string,
    contactNumber: string,
    restaurantID: string,
    branchManagerID: string,
    ownerID: string,
    type: string,
    items: Array<{ id: string, category: string }> | string,
    combos: Array<{ id: string, category: string }> | string,
    customerAnalytics: Array<string> | string,
    revenueAnalytics: Array<string> | string,
    employeeAnalytics: Array<string> | string,
    inventory: Array<string> | string,
    customers: Array<string> | string
}, managerID: string, employees: Array<{ id: string, designation: string }> | string) {
    return {
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        branchName: body.branchName,
        location: body.location,
        email: body.email,
        contactNumber: body.contactNumber,
        restaurantID: body.restaurantID,
        branchManagerID: managerID,
        ownerID: body.ownerID,
        type: body.type,
        employees: employees,
        items: body.items,
        combos: body.combos,
        customerAnalytics: body.customerAnalytics,
        revenueAnalytics: body.revenueAnalytics,
        employeeAnalytics: body.employeeAnalytics,
        inventory: body.inventory,
        customers: body.customers
    }
};

export const addEmployee = function (body: {
    fullName: string,
    email: string,
    ownerID: string,
    restaurantID: string,
    branchID: string,
    contactNumber: string,
    profilePic: string,
    designation: string
}, passwordEncrypted: string) {
    return {
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        fullName: body.fullName,
        email: body.email,
        password: passwordEncrypted,
        ownerID: body.ownerID,
        restaurantID: body.restaurantID,
        profilePic: body.profilePic,
        contactNumber: body.contactNumber,
        designation: body.designation
    }
};

export const addReservation = function (body: {
    customerName: string,
    customerEmail: string,
    customerContact: string,
    branchID: string,
    bookingDate: Date,
    bookingTime: Date,
    guests: number,
    status: 'RESERVED' | 'COMPLETED' | 'ONGOING' | 'CANCELLED'
}) {
    return {
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        customerName: body.customerName,
        customerEmail: body.customerEmail,
        customerContact: body.customerContact,
        branchID: body.branchID,
        bookingDate: body.bookingDate,
        bookingTime: body.bookingTime,
        guests: body.guests,
        status: body.status
    }
};

export const addItem = function (body: {
    name: string,
    cuisine: string,
    type: string,
    branchID: string,
    ratings: number,
    availability: boolean,
    price: number,
    description: string,
    favourite: boolean,
    itemImage: string
}) {
    return {
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        name: body.name,
        cuisine: body.cuisine,
        type: body.type,
        branchID: body.branchID,
        ratings: body.ratings,
        availability: body.availability,
        price: body.price,
        description: body.description,
        favourite: body.favourite,
        itemImage: body.itemImage
    }
};

export const addTable = function (body: {
    branchID: string,
    number: number,
    status: 'ACTIVE' | 'INACTIVE' | 'RESERVED',

}) {
    return {
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        branchID: body.branchID,
        number: body.number,
        status: body.status,
        captainAssigned: 'NO-CAPTAIN',
        onGoingReservation: 'NO-ONGOING-RESERVATION',
        orders: 'NO-ORDERS',
        onGoingOrders: 'NO-ONGOING-ORDERS',
    }
};

export const addCombo = function (body: {
    branchID: string,
    name: string,
    items: Array<string>,
    description: string,
    rating: number,
    price: number,
    status: 'ACTIVE' | 'INACTIVE'
}) {
    return {
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        branchID: body.branchID,
        name: body.name,
        items: body.items,
        description: body.description,
        rating: body.rating,
        price: body.price,
        status: body.status
    }
};

export const addOnlineOrder = function (body: {
    branchID: string,
    customer: {
        name: string,
        location: string,
        contactNumber: string,
        email: string
    },
    items: Array<{
        id: string, name: string, quantity: number
    }>,
    value: number,
    status: 'CONFIRMED' | 'CANCELLED' | 'COMPLETED'
}) {
    return {
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        branchID: body.branchID,
        customer: body.customer,
        items: body.items,
        value: body.value,
        status: body.status
    }
};

export const addOrder = function (body: {
    branchID: string,
    customer: {
        name: string,
        contactNumber:string
    },
    items: Array<{
        id: string, name: string, quantity: number
    }>,
    value: number,
    status: 'ACTIVE'|'SERVED'|'CANCELLED',
    tableNumber: number
}) {
    return {
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        branchID: body.branchID,
        customer: body.customer,
        items: body.items,
        value: body.value,
        status: body.status,
        tableNumber:body.tableNumber
    }
};