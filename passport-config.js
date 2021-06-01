const localStrategy = require('passport-local').Strategy
const bcrypt = require('bcrypt');
const sqlite = require('sqlite3');
const db = new sqlite.Database('../database/db.sqlite');


function initialisePassport(passport) {
    const authenticateUser = async (email, password, done) => {
        db.get('SELECT UserId, Username, Email, PasswordHash FROM Users WHERE Email = ?', email, async (err, row) => {
            if (err) {return done(err)}
            if (!row) { return done(null, false, {message: 'No user with that email'})}
            try {

                if (await bcrypt.compare(password, row.PasswordHash)) {
                    return done(null, row)
                } else {
                    return done(null, false, { message: 'Password incorrect' })
                }
            } catch(e) {
                return done(e);
            }
        })

    }
    passport.use(new localStrategy({ usernameField: 'email' }, authenticateUser));
    passport.serializeUser((user, done) => done(null, user.UserId));
    passport.deserializeUser((id, done) => {
        db.get('SELECT UserId, Username, Email, PasswordHash FROM Users WHERE UserId = ?', id, (err, row) => {
            if (err) {return done(err)}
            return done(null, row)
        })
    });
}

async function saveUser(username, email, password) {
    db.run('INSERT INTO Users (Username, Email, PasswordHash) VALUES (?,?,?)', username, email, password, function(err) {
        if (err) {return err}
        return this.lastID;
    })
}
module.exports = { initialisePassport, saveUser }


// passport.use(new localStrategy(async function(username, password, done) {
//     db.get('SELECT UserId, Username, Email, PasswordHash FROM Users WHERE Username = ?', username, function(err, row) {
//         if (!row) return done(null, false, { message: 'No user with that email' });
//         try {
//             if (await bcrypt.compare(password, row.PasswordHash)) {
//                 return done(null, row)
//             } else {
//                 return done(null, false, { message: 'password is incorrect' })
//             }
//         } catch(e) {
//             return done(e);
//         }
//     })
// }))  

//   passport.use(new LocalStrategy(function(username, password, done) {
//     db.get('SELECT salt FROM users WHERE username = ?', username, function(err, row) {
//       if (!row) return done(null, false);
//       var hash = hashPassword(password, row.salt);
//       db.get('SELECT username, id FROM users WHERE username = ? AND password = ?', username, hash, function(err, row) {
//         if (!row) return done(null, false);
//         return done(null, row);
//       });
//     });
//   }));
  
//   passport.serializeUser(function(user, done) {
//     return done(null, user.UserId);
//   });
  
//   passport.deserializeUser(function(id, done) {
//     db.get('SELECT UserId, Username FROM users WHERE UserId = ?', id, function(err, row) {
//       if (!row) return done(null, false);
//       return done(null, row);
//     });
//   });
  
//   // ...
  
//   app.post('/login', passport.authenticate('local', { successRedirect: '/good-login',
//                                                       failureRedirect: '/bad-login' }));