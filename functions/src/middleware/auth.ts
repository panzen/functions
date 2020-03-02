import * as jwt from "jsonwebtoken";
import * as functions from 'firebase-functions';

module.exports = function (req:any, res:any, next:any){
    const token = req.header('auth-token');
    if(!token) return res.status(401).send('Access denied. No Token');
    try{
        const secretKey = functions.config().authkey.key;
        const decoded = jwt.verify(token,secretKey);
        req.user = decoded;
        next();
    }
    catch(ex){
        res.status(400).send('Invalid token');
    }
};