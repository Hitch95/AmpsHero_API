const User = require("../models/User");
const passport = require("passport");
const jwt = require('jsonwebtoken');

const isAdmin = (req, res, next) => {
    passport.authenticate('jwt', { session: false }, (err, user, info) => {
        if (err) {
            return res.status(500).json({ message: "Erreur d'authentification" });
        }
        if (!user) {
            return res.status(403).json({ message: "Accès non autorisé" });
        }

        User.findById(user.id, function (err, admin) {
            if (err) {
                return res.status(500).json({ message: "Erreur interne du serveur" });
            }
            if (!admin) {
                return res.status(403).json({ message: "Utilisateur non trouvé" });
            }
            if (admin.isAdmin) {
                return next();
            }

            return res.status(403).json({ message: "Requis rôle administrateur" });
        });
    })(req, res, next);
};

const verifyAuthorization = (checkAdmin = false) => {
    return async (req, res, next) => {
        try {
            const authHeader = req.headers['authorization'];
            const token = authHeader && authHeader.split(' ')[1];
            if (!token) {
                return res.status(401).json({ 'error': 'Access Denied: No token provided!' });
            }
            const user = jwt.verify(token, process.env.JWT_SECRET);
            req.user = user;

            if (checkAdmin && !user.isAdmin) {
                return res.status(403).json({ 'error': 'Access Denied!' });
            }
            next();
        } catch (error) {
            return res.status(400).send('Invalid Token');
        }
    }
};

module.exports = { isAdmin, verifyAuthorization };
