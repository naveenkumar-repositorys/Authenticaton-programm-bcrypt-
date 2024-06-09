let express = require("express");
let app = express();

let bcrypt = require("bcrypt");
let path = require("path");
let { open } = require("sqlite");
let sqlite3 = require("sqlite3");

let dbPath = path.join(__dirname, "userData.db");
db = null;
app.use(express.json());

let initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000");
    });
  } catch (e) {
    console.log(`Db Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

//API-1

app.post("/register", async (request, response) => {
  let { username, name, password, gender, location } = request.body;

  let knowUserQuery = `SELECT * FROM user WHERE username = "${username}";`;
  let findUser = await db.get(knowUserQuery);
  if (findUser !== undefined) {
    response.status(400);
    response.send("User already exists");
  } else {
    let passwordToArray = password.split("");
    //console.log(passwordToArray);
    let passwordLength = passwordToArray.length;
    if (passwordLength < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      let hashedPassword = await bcrypt.hash(request.body.password, 10);
      console.log(hashedPassword);
      let createUserQuery = `INSERT INTO 
                user(userName,name,password,gender,location)
                VALUES("${username}",
                    "${name}",
                    "${hashedPassword}",
                    "${gender}",
                    "${location}"
                    );`;
      let newUserInDb = await db.run(createUserQuery);
      console.log(newUserInDb);
      response.status(200);
      response.send("User created successfully");
    }
  }
});

//API-2

app.post("/login/", async (request, response) => {
  let { username, password } = request.body;
  const isUserNameExistsQuery = `SELECT * FROM user WHERE username = "${username}";`;
  let dbResponse = await db.get(isUserNameExistsQuery);
  console.log(dbResponse);
  if (dbResponse === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordMatched = await bcrypt.compare(
      password,
      dbResponse.password
    );
    if (isPasswordMatched === true) {
      response.status(200);
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

//API-3

app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const isUserExistQuery = `SELECT * FROM user WHERE username = "${username}";`;
  const isUserExistDbResponse = await db.get(isUserExistQuery);
  //console.log(isUserExistDbResponse);
  let compareBcryptEl = await bcrypt.compare(
    oldPassword,
    isUserExistDbResponse.password
  );
  //console.log(compareBcryptEl);
  let newPasswordLength = newPassword.split("").length;
  //console.log(newPasswordLength);
  let newHashedPassword = await bcrypt.hash(newPassword, 10);
  if (compareBcryptEl !== true) {
    response.status(400);
    response.send("Invalid current password");
  } else {
    if (newPasswordLength < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      let changePasswordQuery = `UPDATE user 
        SET password = "${newHashedPassword}"
        WHERE username = "${username}";`;
      let updateNewPasswordInDb = await db.run(changePasswordQuery);
      //console.log(updateNewPasswordInDb);
      response.status(200);
      response.send("Password updated");
    }
  }
});

module.exports = app;
