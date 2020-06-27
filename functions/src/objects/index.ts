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

export const addCustomer = function (body: {
    fullName: string,
    contactNumber: string,
    email: string,
}, passwordEncrypted: string) {
    return {
        fullName: body.fullName,
        contactNumber: body.contactNumber,
        email: body.email,
        password: passwordEncrypted,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
    }
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
        inventory: body.inventory,
        customers: body.customers
    }
};

export const addEmployee = function (body: {
    fullName: string,
    email: string,
    branchID: string,
    contactNumber: string,
    profilePic: string,
    accountDetails: {
        name: string,
        bankName: string,
        number: string,
        ifsc: string,
        gst: string
    },
    payScale: { price: number, scale: string },
    address: string,
    designation: string,
    gender: string,
    rating: number,
    status: string,
    workingHours: number,
    employementType: string
}, passwordEncrypted: string, keywords: Array<string>) {
    return {
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        branchID: body.branchID,
        name: body.fullName,
        email: body.email,
        password: passwordEncrypted,
        profilePic: body.profilePic,
        contactNumber: body.contactNumber,
        accountDetails: body.accountDetails,
        keywords,
        gender: body.gender,
        address: body.address,
        payScale: body.payScale,
        rating: 0,
        designation: body.designation,
        status: 'ACTIVE',
        workingHours: body.workingHours,
        employementType: body.employementType,
    }
};

export const addReservation = function (body: {
    customerName: string,
    customerContact: string,
    branchID: string,
    reservationDate: Date,
    reservationTime: Date,
    totalGuests: string,
    // status: 'RESERVED' | 'CANCELLED'
}, keywords: Array<string>) {
    return {
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        customerName: body.customerName,
        customerContact: body.customerContact,
        branchID: body.branchID,
        reservationDate: body.reservationDate,
        reservationTime: body.reservationTime,
        totalGuests: body.totalGuests,
        keywords: keywords,
        status: 'RESERVED'
    }
};

export const addItem = function (body: {
    name: string,
    category: {
        name:string,
        icon:string
    },
    branchID: string,
    ratings: number,
    availability: boolean,
    price: number,
    description: string,
    favorite: boolean,
    itemImage: string,
    // status:'ACTIVE' | 'DELETED'
}, keywords: Array<string>) {
    return {
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        name: body.name,
        category: body.category,
        categoryName:body.category.name,
        branchID: body.branchID,
        ratings: body.ratings,
        availability: body.availability,
        price: body.price,
        description: body.description,
        favorite: body.favorite,
        itemImage: body.itemImage,
        keywords,
        status: 'ACTIVE'
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
    items: Array<{ name: string, id: string }>,
    description: string,
    rating: number,
    price: number,
}, keywords: Array<string>) {
    return {
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        branchID: body.branchID,
        name: body.name,
        items: body.items,
        description: body.description,
        rating: body.rating,
        price: body.price,
        keywords,
        status: 'ACTIVE'
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
}, createdDate: Date) {
    const date: Date = createdDate;
    return {
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        createdDate: `${date.getDate()}:${date.getMonth()}:${date.getFullYear()}`,
        branchID: body.branchID,
        customer: body.customer,
        items: body.items,
        value: body.value,
        status: 'ACTIVE'
    }
};

export const addOrder = function (body: {
    branchID: string,
    customer: {
        name: string,
        contactNumber: string
    },
    items: Array<{
        id: string, name: string, quantity: number
    }>,
    value: number,
    status: 'ACTIVE' | 'SERVED' | 'CANCELLED',
    tableNumber: number
}) {
    return {
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        branchID: body.branchID,
        customer: body.customer,
        items: body.items,
        value: body.value,
        status: body.status,
        tableNumber: body.tableNumber
    }
};

export const addSupplier = function (body: {
    fullName: string,
    contactNumber: string,
    email: string,
    rawItems: Array<{id:string,name:string}>,
    method: 'CASH' | 'BANKING',
    branchID: string,
    accountDetails?: {
        name: string,
        bankName: string,
        number: string,
        ifsc: string,
        gst: string
    },
}, keywords: Array<string>) {
    return {
        fullName: body.fullName,
        contactNumber: body.contactNumber,
        email: body.email,
        rawItems: body.rawItems,
        method: body.method,
        accountDetails: body.accountDetails,
        keywords,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
    }
};

export const addCategory_unit = function (body: {
    name: string,
    defaultBool: boolean,
    branchID: string,
}) {
    return {
        name: body.name,
        defaultBool: body.defaultBool,
        branchID: body.branchID,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
    }
};

export const addMenu_category = function (body: {
    name: string,
    icon: string,
    branchID: string,
}) {
    return {
        name: body.name,
        icon: body.icon,
        branchID: body.branchID,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
    }
};

export const addStorage = function (body: {
    name: string,
    cleaningSchedule: string,
    branchID: string,
    lastClean: Date,
    employeeInCharge: {
        id: string,
        name: string
    }
}) {
    return {
        name: body.name,
        cleaningSchedule: body.cleaningSchedule,
        branchID: body.branchID,
        lastClean: body.lastClean,
        employeeInCharge: body.employeeInCharge,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
    }
};

export const addWastage = function (body: {
    item: { id: string, name: string },
    branchID: string,
    type: string,
    reason: string,
    employeeInCharge: {
        id: string,
        name: string
    },
    units: number,
    UOM: {
        id: string,
        name: string
    }
}, cost: number) {
    return {
        items: body.item,
        branchID: body.branchID,
        type: body.type,
        reason: body.reason,
        employeeInCharge: body.employeeInCharge,
        units: body.units,
        cost,
        UOM: body.UOM,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
    }
};

export const addExpense = function (body: {
    items: Array<{ name: string, quantity: string, price: number }>,
    branchID: string,
    type: string,
    period: string,
    comments: string,
    employeeIncharge: {
        id: string,
        name: string
    },
    paymentStatus: string,
    billAmount: string,
    category: string

}, keywords: Array<string>) {
    return {
        items: body.items,
        branchID: body.branchID,
        type: body.type,
        comments: body.comments,
        employeeIncharge: body.employeeIncharge,
        paymentStatus: body.paymentStatus,
        category: body.category,
        billAmount: body.billAmount,
        period: body.period,
        keywords,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
    }
};

export const addExpenseCategory = function (body: {
    branchID: string,
    name: string
}) {
    return {
        branchID: body.branchID,
        name: body.name,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
    }
};

export const addInventoryItem = function (body: {
    name: string,
    branchID: string,
    life: number,
    category: {
        id: string,
        name: string
    },
    pricePerUnit: number,
    UOM: {
        id: string,
        name: string
    },
    storage: {
        id: string,
        name: string
    },
    UIH: number,
    totalCost: number
}, keywords: Array<string>) {
    return {
        name: body.name,
        branchID: body.branchID,
        life: body.life,
        category: body.category,
        pricePerUnit: body.pricePerUnit,
        UOM: body.UOM,
        storage: body.storage,
        UIH: body.UIH,
        keywords,
        totalCost: body.totalCost,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
    }
};